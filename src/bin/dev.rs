use std::{path::PathBuf, process::Stdio, sync::Arc, time::Duration};

use anyhow::Context;
use blakerain_com::tracing::setup_tracing;
use futures_util::{SinkExt, StreamExt};
use notify_debouncer_full::{
    DebounceEventResult, Debouncer, RecommendedCache, new_debouncer,
    notify::{Event, RecommendedWatcher, RecursiveMode},
};
use poem::{
    EndpointExt, IntoResponse,
    endpoint::StaticFilesEndpoint,
    handler,
    listener::TcpListener,
    middleware::Tracing,
    web::{
        Data,
        websocket::{Message, WebSocket},
    },
};
use poem_route_macro::define_routes;
use serde::Deserialize;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
    sync::broadcast::{self, error::RecvError},
};
use tracing::Instrument;

#[derive(Debug, Deserialize)]
struct WatchConfig {
    directories: Vec<PathBuf>,
    #[serde(default)]
    exclude_directories: Vec<PathBuf>,
    files: Vec<PathBuf>,
}

fn canonicalize_paths(paths: Vec<PathBuf>) -> Vec<PathBuf> {
    paths
        .into_iter()
        .filter_map(|path| {
            let Ok(path) = path.canonicalize() else {
                tracing::error!(?path, "failed to canonicalize path");
                return None;
            };

            Some(path)
        })
        .collect()
}

impl WatchConfig {
    fn canonicalize_paths(&mut self) {
        self.directories = canonicalize_paths(self.directories.clone());
        self.exclude_directories = canonicalize_paths(self.exclude_directories.clone());
        self.files = canonicalize_paths(self.files.clone());
    }

    fn is_trigger_path(&self, path: &PathBuf) -> bool {
        let Ok(path) = path.canonicalize() else {
            tracing::error!(?path, "failed to canonicalize path");
            return false;
        };

        if self.directories.iter().any(|dir| path.starts_with(dir)) {
            return true;
        }

        if self
            .exclude_directories
            .iter()
            .any(|dir| path.starts_with(dir))
        {
            return false;
        }

        self.files.contains(&path)
    }
}

#[derive(Debug, Deserialize, Clone, Copy)]
enum BuildMode {
    Debug,
    Release,
}

#[derive(Debug, Deserialize)]
struct DevConfig {
    #[serde(default = "default_host")]
    host: String,
    #[serde(default = "default_port")]
    port: u16,
    jobs: Option<usize>,
    #[serde(default = "default_debounce_ms")]
    debounce_ms: u64,
    #[serde(default = "default_build_mode")]
    build_mode: BuildMode,
    watch: WatchConfig,
}

fn default_host() -> String {
    "127.0.0.1".into()
}

fn default_port() -> u16 {
    3000
}

fn default_debounce_ms() -> u64 {
    200
}

fn default_build_mode() -> BuildMode {
    BuildMode::Release
}

impl DevConfig {
    async fn load() -> anyhow::Result<Self> {
        let source = tokio::fs::read_to_string("dev.json")
            .await
            .context("failed to read dev.json")?;
        let mut config =
            serde_json::from_str::<DevConfig>(&source).context("failed to parse dev.json")?;
        config.watch.canonicalize_paths();

        Ok(config)
    }

    fn get_jobs(&self) -> usize {
        if let Some(jobs) = self.jobs {
            jobs
        } else if let Ok(jobs) = std::thread::available_parallelism() {
            jobs.get()
        } else {
            1
        }
    }

    fn get_debounce(&self) -> Duration {
        Duration::from_millis(self.debounce_ms)
    }
}

async fn run_make(config: &DevConfig) -> anyhow::Result<bool> {
    let mut child = Command::new("make");

    child.arg("-j").arg(config.get_jobs().to_string());

    match config.build_mode {
        BuildMode::Debug => child.arg("MODE=debug"),
        BuildMode::Release => child.arg("MODE=release"),
    };

    let mut child = child
        .arg("ANSI=false")
        .arg("RELOADER=true")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take().context("failed to get stdout")?;
    let stderr = child.stderr.take().context("failed to get stderr")?;

    let stdout_reader = BufReader::new(stdout).lines();
    let stderr_reader = BufReader::new(stderr).lines();

    let stdout_task = tokio::spawn(
        async move {
            let mut reader = stdout_reader;
            while let Some(line) = reader.next_line().await.unwrap_or(None) {
                tracing::info!("{}", line);
            }
        }
        .instrument(tracing::info_span!("stdout")),
    );

    let stderr_task = tokio::spawn(
        async move {
            let mut reader = stderr_reader;
            while let Some(line) = reader.next_line().await.unwrap_or(None) {
                tracing::info!("{}", line);
            }
        }
        .instrument(tracing::info_span!("stderr")),
    );

    let status = child
        .wait()
        .await
        .context("failed to wait for child process")?;

    tracing::info!("child process exited with status {}", status);
    stdout_task
        .await
        .context("failed to wait for stdout task")?;
    stderr_task
        .await
        .context("failed to wait for stderr task")?;

    if !status.success() {
        tracing::error!("make failed");
    }

    Ok(status.success())
}

#[derive(Debug, Clone)]
struct Reloader {
    reload_tx: broadcast::Sender<ReloadMessage>,
}

#[derive(Debug, Clone, Copy)]
enum ReloadMessage {
    Reload,
}

impl std::fmt::Display for ReloadMessage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Reload => write!(f, "reload"),
        }
    }
}

impl Reloader {
    pub fn new() -> Self {
        let (reload_tx, mut reload_rx) = broadcast::channel::<ReloadMessage>(16);

        tokio::spawn(
            async move {
                loop {
                    if reload_rx.recv().await.is_ok() {
                        tracing::info!("reload message sent");
                    } else {
                        tracing::error!("reload channel closed");
                        break;
                    }
                }
            }
            .instrument(tracing::info_span!("reloader")),
        );

        Self { reload_tx }
    }

    pub fn subscribe(&self) -> broadcast::Receiver<ReloadMessage> {
        self.reload_tx.subscribe()
    }

    pub fn reload(&self) -> anyhow::Result<()> {
        self.reload_tx
            .send(ReloadMessage::Reload)
            .context("failed to send reload message")?;
        Ok(())
    }
}

#[derive(Debug)]
struct Builder {
    build_tx: broadcast::Sender<BuildMessage>,
}

#[derive(Debug, Clone, Copy)]
enum BuildMessage {
    Build,
}

impl Builder {
    async fn start(config: Arc<DevConfig>, reloader: Reloader) -> anyhow::Result<Self> {
        let (build_tx, build_rx) = broadcast::channel::<BuildMessage>(16);

        tokio::spawn(
            async move {
                let mut build_rx = build_rx;

                loop {
                    match build_rx.recv().await {
                        Ok(message) => match message {
                            BuildMessage::Build => {
                                tracing::info!("Rebuilding ...");
                                if let Ok(true) = run_make(&config).await {
                                    tracing::info!("Rebuild successful");
                                    if let Err(err) = reloader.reload() {
                                        tracing::error!(
                                            error = ?err,
                                            "Failed to notify reloader"
                                        );
                                    }
                                }
                            }
                        },

                        Err(RecvError::Lagged(_)) => {}
                        Err(RecvError::Closed) => {
                            tracing::info!("Build channel closed");
                            break;
                        }
                    }
                }
            }
            .instrument(tracing::info_span!("builder")),
        );

        Ok(Self { build_tx })
    }

    fn build(&self) -> anyhow::Result<()> {
        self.build_tx
            .send(BuildMessage::Build)
            .context("failed to send build message")?;
        Ok(())
    }
}

fn is_interesting_event(event: &Event) -> bool {
    use notify_debouncer_full::notify::event::{
        EventKind::*,
        ModifyKind::{self, *},
    };

    matches!(
        event.kind,
        Create(_) | Remove(_) | Modify(Data(_) | Name(_) | ModifyKind::Any)
    )
}

async fn watcher(
    config: Arc<DevConfig>,
    builder: Builder,
) -> anyhow::Result<Debouncer<RecommendedWatcher, RecommendedCache>> {
    let mut debouncer = new_debouncer(config.get_debounce(), None, {
        let config = config.clone();

        move |result: DebounceEventResult| match result {
            Ok(events) => {
                let should_build = events.iter().any(|event| {
                    if !is_interesting_event(&event.event) {
                        return false;
                    }

                    event
                        .paths
                        .iter()
                        .any(|path| config.watch.is_trigger_path(path))
                });

                if should_build {
                    tracing::debug!(?events, "Should rebuild");

                    let _ = builder.build();
                }
            }

            Err(errors) => {
                for err in errors {
                    tracing::error!("Watch error: {err}");
                }
            }
        }
    })
    .context("failed to create file watcher")?;

    for dir in &config.watch.directories {
        if dir.exists() {
            tracing::info!("Watching directory: {}", dir.display());

            debouncer
                .watch(dir, RecursiveMode::Recursive)
                .with_context(|| format!("Failed to watch directory: {}", dir.display()))?;
        } else {
            tracing::error!("Watch directory does not exist: {}", dir.display());
        }
    }

    Ok(debouncer)
}

#[handler]
async fn get_websocket(ws: WebSocket, tx: Data<&Reloader>) -> impl IntoResponse {
    let mut rx = tx.subscribe();

    ws.on_upgrade(move |mut socket| async move {
        loop {
            tokio::select! {
                msg = rx.recv() => {
                    match msg {
                        Ok(message) => {
                            let message = message.to_string();
                            tracing::info!("sending message to client: {message:?}");
                            if let Err(err) = socket.send(Message::Text(message)).await {
                                tracing::error!(
                                    error = ?err,
                                    "failed to send message to client"
                                );

                                break;
                            }
                        }
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(broadcast::error::RecvError::Closed) => {
                            tracing::info!("websocket closed");
                            break;
                        },
                    }
                }

                recv = socket.next() => {
                    match recv {
                        Some(Ok(message)) => {
                            tracing::info!("received message from client: {message:?}");
                        }

                        Some(Err(_)) | None => break,
                    }
                }
            }
        }
    })
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    setup_tracing(Some(true), None);

    tracing::info!("Loading config");
    let config = Arc::new(DevConfig::load().await?);

    tracing::info!("Running first build");
    run_make(&config).await?;

    tracing::info!("Starting server");

    let reloader = Reloader::new();
    let builder = Builder::start(Arc::clone(&config), reloader.clone()).await?;
    let debouncer = watcher(Arc::clone(&config), builder).await?;

    let static_ep = StaticFilesEndpoint::new("output").index_file("index.html");

    let routes = define_routes!({
        "/__dev/ws" websocket GET
        *"/"        { static_ep }
    });

    let app = routes.data(reloader).with(Tracing);

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("serving at http://{addr}");

    poem::Server::new(TcpListener::bind(addr))
        .run(app)
        .await
        .context("server error")?;

    debouncer.stop();

    Ok(())
}
