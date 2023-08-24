use std::path::{Path, PathBuf};

use site::app::{App, AppProps};
use yew::ServerRenderer;

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

const STATIC_ROUTES: &[&str] = &["/", "/about", "/blog", "/disclaimer"];

async fn collect_routes(root_dir: impl AsRef<Path>) -> std::io::Result<Vec<RenderRoute>> {
    let root_dir = root_dir.as_ref();
    let mut routes = Vec::new();
    for route in STATIC_ROUTES {
        routes.push(RenderRoute {
            url: route.to_string(),
            path: if *route == "/" {
                PathBuf::from("index.html")
            } else {
                PathBuf::from(&route[1..]).with_extension("html")
            },
        })
    }

    let posts_dir = root_dir.join("content").join("posts");
    log::info!("Collecting blog posts from: {posts_dir:?}");
    let mut posts = tokio::fs::read_dir(posts_dir).await?;
    while let Some(entry) = posts.next_entry().await? {
        let filename = PathBuf::from(entry.file_name());
        let url = format!(
            "/blog/{}",
            filename
                .file_stem()
                .expect("there to be a filename")
                .to_str()
                .unwrap()
        );
        let path = Path::new("blog").join(filename.with_extension("html"));
        routes.push(RenderRoute { url, path })
    }

    Ok(routes)
}

async fn copy_resources(
    dist_dir: impl AsRef<Path>,
    out_dir: impl AsRef<Path>,
) -> std::io::Result<()> {
    let mut resources = tokio::fs::read_dir(dist_dir).await?;
    while let Some(entry) = resources.next_entry().await? {
        let Ok(file_type) = entry.file_type().await else {
            log::error!("Could not get file type for: {:?}", entry.path());
            continue;
        };

        if file_type.is_file() {
            if entry.file_name() == "index.html" {
                continue;
            }

            let path = entry.path();
            log::info!("Copying resource: {:?}", path);
            tokio::fs::copy(path, out_dir.as_ref().join(entry.file_name())).await?;
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

    for RenderRoute { url, path } in collect_routes(&root_dir).await? {
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
