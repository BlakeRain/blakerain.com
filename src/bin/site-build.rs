use std::path::{Path, PathBuf};

use site::{
    app::{App, AppProps},
    pages::Route,
};
use yew::ServerRenderer;
use yew_router::Routable;

struct Template {
    content: String,
    index: usize,
}

impl Template {
    async fn load(path: impl AsRef<Path>) -> std::io::Result<Self> {
        log::info!("Loading template from: {:?}", path.as_ref());
        let content = tokio::fs::read_to_string(path).await?;

        let Some(index) = content.find("</body>") else {
            log::error!("Failed to find index of '</body>' close tag in 'dist/index.html'");
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "Malformed index.html"));
        };

        Ok(Self { content, index })
    }

    async fn render(&self, app: ServerRenderer<App>) -> String {
        let mut result = String::with_capacity(self.content.len());
        result.push_str(&self.content[..self.index]);
        app.render_to_string(&mut result).await;
        result.push_str(&self.content[self.index..]);
        result
    }
}

async fn render_route(template: &Template, url: String) -> String {
    let render = ServerRenderer::<App>::with_props(move || AppProps { url });
    template.render(render).await
}

struct RenderRoute {
    pub url: String,
    pub path: PathBuf,
}

fn collect_routes() -> Vec<RenderRoute> {
    enum_iterator::all::<Route>()
        .map(|route| {
            let url = route.to_path();
            let path = if url == "/" {
                PathBuf::from("index.html")
            } else {
                PathBuf::from(&url[1..]).with_extension("html")
            };

            RenderRoute { url, path }
        })
        .collect()
}

async fn copy_resources(
    dist_dir: impl AsRef<Path>,
    out_dir: impl AsRef<Path>,
) -> std::io::Result<()> {
    let mut stack: Vec<(PathBuf, PathBuf)> = vec![(
        dist_dir.as_ref().to_path_buf(),
        out_dir.as_ref().to_path_buf(),
    )];

    while let Some((dist_dir, out_dir)) = stack.pop() {
        if !out_dir.exists() {
            log::info!("Creaing output directory: {out_dir:?}");
            tokio::fs::create_dir(&out_dir).await?;
        }

        let mut resources = tokio::fs::read_dir(&dist_dir).await?;
        while let Some(entry) = resources.next_entry().await? {
            let Ok(file_type) = entry.file_type().await else {
                log::error!("Could not get file type for: {:?}", entry.path());
                continue;
            };

            if file_type.is_file() {
                let file_name = entry
                    .file_name()
                    .to_str()
                    .expect("valid filename")
                    .to_string();

                if file_name == "index.html" {
                    continue;
                }

                if file_name.starts_with('.') {
                    continue;
                }

                let path = entry.path();
                log::info!("Copying resource: {:?}", path);
                tokio::fs::copy(path, out_dir.join(file_name)).await?;
            }

            if file_type.is_dir() {
                let name = entry.file_name();
                let out_dir = out_dir.join(name.clone());
                let dist_dir = dist_dir.join(name.clone());
                stack.push((dist_dir, out_dir));
            }
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let root_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    let dist_dir = root_dir.clone().join("dist");
    log::info!("Established distribution directory: {dist_dir:?}");
    let template = Template::load(dist_dir.join("index.html")).await?;

    let out_dir = root_dir.join("output");

    if out_dir.exists() {
        log::info!("Removing existing output directory: {out_dir:?}");
        tokio::fs::remove_dir_all(&out_dir).await?;
    }

    log::info!("Creating output directory: {out_dir:?}");
    tokio::fs::create_dir_all(&out_dir).await?;

    log::info!("Copying resources to output directory");
    copy_resources(&dist_dir, &out_dir).await?;

    for RenderRoute { url, path } in collect_routes() {
        log::info!("Rendering route: {url}");
        let html = render_route(&template, url).await;
        let path = out_dir.clone().join(path);

        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        log::info!("Writing route to file: {path:?}");
        tokio::fs::write(path, html).await?;
    }

    Ok(())
}
