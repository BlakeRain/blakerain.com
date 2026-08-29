use std::{
    path::{Path, PathBuf},
    process::Stdio,
    sync::Arc,
    time::Duration,
};

use anyhow::Context;
use blakerain_com::tracing::setup_tracing;
use futures_util::{SinkExt, StreamExt};
use notify_debouncer_full::{
    DebounceEventResult, new_debouncer,
    notify::{Event, RecursiveMode},
};
use poem::{
    EndpointExt, IntoResponse, Route,
    endpoint::StaticFilesEndpoint,
    handler,
    listener::TcpListener,
    web::Data,
    web::websocket::{Message, WebSocket},
};
use serde::Deserialize;
use tokio::{
    io::{AsyncBufReadExt, BufReader},
    process::Command,
    sync::broadcast,
};

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

        if self.directories.iter().any(|dir| {
            tracing::info!(
                "{:?} starts with {:?} = {}",
                path,
                dir,
                path.starts_with(dir)
            );
            path.starts_with(dir)
        }) {
            return true;
        }

        if self
            .exclude_directories
            .iter()
            .any(|dir| path.starts_with(dir))
        {
            tracing::info!("path {:?} starts with an excluded directory", path);
            return false;
        }

        self.files.iter().any(|file| path == *file)
    }
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
    watch: WatchConfig,
}

impl DevConfig {
    fn get_jobs(&self) -> usize {
        if let Some(jobs) = self.jobs {
            jobs
        } else if let Ok(jobs) = std::thread::available_parallelism() {
            jobs.get()
        } else {
            1
        }
    }
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

async fn run_make(config: &DevConfig) -> anyhow::Result<bool> {
    let mut child = Command::new("make")
        .arg("-j")
        .arg(config.get_jobs().to_string())
        .arg("MODE=debug")
        .arg("ANSI=false")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take().context("failed to get stdout")?;
    let stderr = child.stderr.take().context("failed to get stderr")?;

    let stdout_reader = BufReader::new(stdout).lines();
    let stderr_reader = BufReader::new(stderr).lines();

    let stdout_task = tokio::spawn(async move {
        let mut reader = stdout_reader;
        while let Some(line) = reader.next_line().await.unwrap_or(None) {
            tracing::info!("{}", line);
        }
    });

    let stderr_task = tokio::spawn(async move {
        let mut reader = stderr_reader;
        while let Some(line) = reader.next_line().await.unwrap_or(None) {
            tracing::info!("{}", line);
        }
    });

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

#[handler]
async fn ws_handler(ws: WebSocket, tx: Data<&broadcast::Sender<String>>) -> impl IntoResponse {
    let mut rx = tx.subscribe();

    ws.on_upgrade(move |mut socket| async move {
        loop {
            tokio::select! {
                msg = rx.recv() => {
                    match msg {
                        Ok(text) => {
                            tracing::info!("sending message to client: {text}");
                            if socket.send(Message::Text(text)).await.is_err() {
                                break;
                            }
                        }
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(broadcast::error::RecvError::Closed) => break,
                    }
                }

                recv = socket.next() => {
                    match recv {
                        Some(Ok(_)) => {}
                        Some(Err(_)) | None => break,
                    }
                }
            }
        }
    })
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

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    setup_tracing(Some(true), None);

    let config: Arc<DevConfig> = {
        let source = std::fs::read_to_string("dev.json").context("failed to read dev.json")?;
        let mut config =
            serde_json::from_str::<DevConfig>(&source).context("failed to parse dev.json")?;
        config.watch.canonicalize_paths();
        Arc::new(config)
    };

    tracing::info!("Running first build ...");
    run_make(&config).await?;

    tracing::info!("Starting server");

    let (reload_tx, _) = broadcast::channel::<String>(16);
    let (build_tx, build_rx) = broadcast::channel::<()>(16);

    {
        let reload_tx = reload_tx.clone();
        let config = config.clone();

        tokio::spawn(async move {
            let mut build_rx = build_rx;

            loop {
                match build_rx.recv().await {
                    Ok(()) => {
                        tracing::info!("changes detected, rebuilding ...");
                        if let Ok(true) = run_make(&config).await {
                            tracing::info!("rebuild complete");
                            let _ = reload_tx.send("reload".into());
                        }
                    }

                    Err(broadcast::error::RecvError::Lagged(_)) => {}
                    Err(broadcast::error::RecvError::Closed) => {
                        tracing::info!("build channel closed");
                        break;
                    }
                }
            }
        });
    }

    let mut debouncer = new_debouncer(Duration::from_millis(config.debounce_ms), None, {
        let config = config.clone();

        move |result: DebounceEventResult| match result {
            Ok(events) => {
                tracing::info!("debouncer event: {:#?}", events);

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
                    let _ = build_tx.send(());
                }
            }
            Err(errors) => {
                for e in errors {
                    eprintln!("watch error: {e}");
                }
            }
        }
    })
    .context("failed to create file watcher")?;

    for dir in &config.watch.directories {
        let path = Path::new(dir);

        if path.exists() {
            tracing::info!("watching directory: {}", dir.display());

            debouncer
                .watch(path, RecursiveMode::Recursive)
                .with_context(|| format!("failed to watch directory: {}", dir.display()))?;
        } else {
            tracing::error!("watch directory does not exist: {}", dir.display());
        }
    }

    let app = Route::new()
        .at("/__dev/ws", poem::get(ws_handler.data(reload_tx)))
        .nest(
            "/",
            StaticFilesEndpoint::new("output").index_file("index.html"),
        );

    let addr = format!("{}:{}", config.host, config.port);
    tracing::info!("serving at http://{addr}");

    poem::Server::new(TcpListener::bind(addr))
        .run(app)
        .await
        .context("server error")?;

    Ok(())
}
