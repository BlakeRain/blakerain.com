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
        println!("Loading template from: {:?}", path.as_ref());
        let content = tokio::fs::read_to_string(path).await?;

        let Some(index) = content.find("</body>") else {
            eprintln!("error: Failed to find index of '</body>' close tag in 'dist/index.html'");
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

struct Env {
    dist_dir: PathBuf,
    out_dir: PathBuf,
    template: Template,
}

impl Env {
    async fn new() -> std::io::Result<Self> {
        let root_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let dist_dir = root_dir.clone().join("dist");
        let out_dir = root_dir.clone().join("output");
        let template = Template::load(dist_dir.join("index.html")).await?;

        if out_dir.exists() {
            println!("Removing existing output directory");
            tokio::fs::remove_dir_all(&out_dir).await?;
        }

        println!("Creating output directory");
        tokio::fs::create_dir_all(&out_dir).await?;

        Ok(Self {
            dist_dir,
            out_dir,
            template,
        })
    }

    async fn render_route(&self, url: String) -> String {
        let render = ServerRenderer::<App>::with_props(move || AppProps { url });
        self.template.render(render).await
    }

    async fn write_str<P: AsRef<Path>>(&self, path: P, s: &str) -> std::io::Result<()> {
        let path = self.out_dir.clone().join(path);
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tokio::fs::write(path, s).await
    }
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

async fn render_routes(env: &Env) -> std::io::Result<()> {
    println!("Rendering routes ...");
    for RenderRoute { url, path } in collect_routes() {
        println!("Rendering route: {url}");

        let html = env.render_route(url).await;
        env.write_str(path, &html).await?;
    }

    Ok(())
}

async fn copy_resources(env: &Env) -> std::io::Result<()> {
    println!("Copyying resources ...");
    let mut stack: Vec<(PathBuf, PathBuf)> = vec![(PathBuf::from("."), PathBuf::from("."))];

    while let Some((dist_prefix, out_prefix)) = stack.pop() {
        let out_dir = env.out_dir.join(&out_prefix);
        if !out_dir.exists() {
            tokio::fs::create_dir(&out_dir).await?;
        }

        let dist_dir = env.dist_dir.join(&dist_prefix);
        let mut resources = tokio::fs::read_dir(&dist_dir).await?;
        while let Some(entry) = resources.next_entry().await? {
            let Ok(file_type) = entry.file_type().await else {
                eprintln!("error: could not get file type for: {:?}", entry.path());
                continue;
            };

            if file_type.is_file() {
                let file_name = entry
                    .file_name()
                    .to_str()
                    .expect("valid filename")
                    .to_string();

                if file_name == "index.html" || file_name.starts_with(".") {
                    println!("Skipping resource: {:?}", dist_prefix.join(file_name));
                    continue;
                }

                let path = entry.path();
                println!("Copying resource: {:?}", out_prefix.join(&file_name));

                let out_path = out_dir.join(&file_name);
                if out_path.exists() {
                    eprintln!("error: output file already exists: {:?}", out_path);
                    return Err(std::io::Error::new(
                        std::io::ErrorKind::AlreadyExists,
                        "Already exists",
                    ));
                }

                tokio::fs::copy(path, out_dir.join(file_name)).await?;
            }

            if file_type.is_dir() {
                let name = entry.file_name();
                let new_dist_prefix = dist_prefix.join(&name);
                let new_out_prefix = out_prefix.join(&name);
                stack.push((new_dist_prefix, new_out_prefix));
            }
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the logger for the site application
    env_logger::init();

    // Create our environment.
    let env = Env::new().await?;

    // Render all the routes
    render_routes(&env).await?;

    // Copy over all the other resources.
    copy_resources(&env).await?;

    Ok(())
}
