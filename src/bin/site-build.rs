use std::{
    fmt::Write,
    path::{Path, PathBuf},
};

use site::{
    app::{StaticApp, StaticAppProps},
    components::head::{HeadContext, HeadRender, HeadRenderProps},
    pages::Route,
};

use chrono::Datelike;
use time::format_description::well_known::{Rfc2822, Rfc3339};
use yew::LocalServerRenderer;
use yew_router::Routable;

struct Template {
    content: String,
    head_index: usize,
    body_index: usize,
}

impl Template {
    async fn load(path: impl AsRef<Path>) -> std::io::Result<Self> {
        println!("Loading template from: {:?}", path.as_ref());
        let content = tokio::fs::read_to_string(path).await?;

        let Some(head_index) = content.find("<script id=\"head-ssg-after\"") else {
            eprintln!("error: Failed to find index of 'head-ssg-after' tag in 'dist/index.html'");
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "Malformed index.html"));
        };

        let Some(body_index) = content.find("</body>") else {
            eprintln!("error: Failed to find index of '</body>' close tag in 'dist/index.html'");
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "Malformed index.html"));
        };

        Ok(Self {
            content,
            head_index,
            body_index,
        })
    }

    async fn render(&self, head: String, body: String) -> String {
        if head.is_empty() {
            eprintln!("warning: empty <head>");
        }

        if body.is_empty() {
            eprintln!("warning: empty <body>");
        }

        let mut result = String::with_capacity(self.content.len());
        result.push_str(&self.content[..self.head_index]);
        result.push_str(&head);
        result.push_str(&self.content[self.head_index..self.body_index]);
        result.push_str(&body);
        result.push_str(&self.content[self.body_index..]);
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

    async fn render_route(&self, route: Route) -> String {
        let head = HeadContext::default();

        let render = {
            let head = head.clone();
            LocalServerRenderer::<StaticApp>::with_props(StaticAppProps { route, head })
        };

        let mut body = String::new();
        render.render_to_string(&mut body).await;

        let render =
            LocalServerRenderer::<HeadRender>::with_props(HeadRenderProps { context: head });

        let mut head = String::new();
        render.render_to_string(&mut head).await;

        self.template.render(head, body).await
    }

    async fn write_str<P: AsRef<Path>>(&self, path: P, s: &str) -> std::io::Result<()> {
        let path = self.out_dir.clone().join(path);
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tokio::fs::write(path, s).await
    }

    async fn write_u8<P: AsRef<Path>>(&self, path: P, d: &[u8]) -> std::io::Result<()> {
        let path = self.out_dir.clone().join(path);
        if let Some(parent) = path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        tokio::fs::write(path, d).await
    }
}

struct RenderRoute {
    pub route: Route,
    pub path: PathBuf,
}

fn collect_routes() -> Vec<RenderRoute> {
    enum_iterator::all::<Route>()
        .map(|route| {
            let path = route.to_path();
            let path = if path == "/" {
                PathBuf::from("index.html")
            } else {
                PathBuf::from(&path[1..]).with_extension("html")
            };

            RenderRoute { route, path }
        })
        .collect()
}

async fn render_routes(env: &Env) -> std::io::Result<()> {
    println!("Rendering routes ...");
    for RenderRoute { route, path } in collect_routes() {
        println!("Rendering route: {}", route.to_path());

        let html = env.render_route(route).await;
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

async fn generate_sitemap(env: &Env) -> std::io::Result<()> {
    println!("Rendering sitemap.xml ...");
    let now = time::OffsetDateTime::now_utc()
        .format(&Rfc3339)
        .expect("formatted time");

    let common =
        format!("<lastmod>{now}</lastmod><changefreq>daily</changefreq><priority>0.7</priority>");

    let mut result = String::new();
    write!(result, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>").expect("write to string");
    write!(
        result,
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
    )
    .expect("write to string");

    for route in enum_iterator::all::<Route>() {
        if !route.should_index() {
            continue;
        }

        let url = route.to_path();
        write!(
            result,
            "<url><loc>https://blakerain.com{url}</loc>{common}</url>"
        )
        .expect("write to string");
    }

    write!(result, "</urlset>").expect("write to string");
    env.write_str("sitemap.xml", &result).await?;

    Ok(())
}

async fn generate_rss(env: &Env) -> std::io::Result<()> {
    println!("Rendering feed.xml ...");

    let now = time::OffsetDateTime::now_utc();

    let items = site::model::blog::documents()
        .into_iter()
        .map(|doc| {
            let mut item = rss::ItemBuilder::default();

            item.title(doc.summary.title)
                .author(Some("blake.rain@blakerain.com (Blake Rain)".to_string()))
                .link(format!(
                    "https://blakerain.com{}",
                    Route::BlogPost {
                        doc_id: doc.summary.slug
                    }
                    .to_path()
                ))
                .guid(
                    rss::GuidBuilder::default()
                        .value(format!(
                            "https://blakerain.com{}",
                            Route::BlogPost {
                                doc_id: doc.summary.slug
                            }
                            .to_path()
                        ))
                        .permalink(true)
                        .build(),
                );

            if let Some(published) = doc.summary.published {
                item.pub_date(published.format(&Rfc2822).expect("formatted time"));
            }

            if let Some(excerpt) = doc.summary.excerpt {
                item.description(excerpt);
            }

            if let Some(cover_image) = doc.cover_image {
                item.enclosure(
                    rss::EnclosureBuilder::default()
                        .url(format!("https://blakerain.com{}", cover_image))
                        .mime_type("image/jpeg")
                        .build(),
                );
            }

            item.build()
        })
        .collect::<Vec<_>>();

    let channel = rss::ChannelBuilder::default()
        .title("Blake Rain")
        .link("https://blakerain.com/")
        .description("Feed of blog posts on Blake Rain's website")
        .language(Some("en".to_string()))
        .copyright(format!("All Rights Reserved {}, Blake Rain", now.year()))
        .last_build_date(Some(now.format(&Rfc2822).expect("formatted time")))
        .docs(Some(
            "https://validator.w3.org/feed/docs/rss2.html".to_string(),
        ))
        .image(Some(
            rss::ImageBuilder::default()
                .title("Blake Rain")
                .url("https://blakerain.com/media/logo-text.png")
                .link("https://blakerain.com/")
                .build(),
        ))
        .items(items)
        .build();

    let mut result = Vec::new();
    channel.write_to(&mut result).expect("RSS");

    env.write_u8("feeds/feed.xml", &result).await
}

async fn generate_atom(env: &Env) -> std::io::Result<()> {
    println!("Rendering atom.xml ...");

    let now = chrono::offset::Utc::now();

    let items = site::model::blog::documents()
        .into_iter()
        .map(|doc| {
            let mut entry = atom_syndication::EntryBuilder::default();

            entry
                .title(
                    atom_syndication::TextBuilder::default()
                        .value(doc.summary.title)
                        .build(),
                )
                .id(format!(
                    "https://blakerain.com{}",
                    Route::BlogPost {
                        doc_id: doc.summary.slug
                    }
                    .to_path()
                ))
                .link(
                    atom_syndication::LinkBuilder::default()
                        .href(format!(
                            "https://blakerain.com{}",
                            Route::BlogPost {
                                doc_id: doc.summary.slug
                            }
                            .to_path()
                        ))
                        .build(),
                )
                .author(
                    atom_syndication::PersonBuilder::default()
                        .name("Blake Rain")
                        .email(Some("blake.rain@blakerain.com".to_string()))
                        .uri(Some("https://blakerain.com".to_string()))
                        .build(),
                );

            if let Some(published) = doc.summary.published {
                let chrono_bullshit = chrono::DateTime::from_utc(
                    chrono::naive::NaiveDateTime::from_timestamp_opt(published.unix_timestamp(), 0)
                        .expect("time to be simple"),
                    chrono::offset::FixedOffset::west_opt(0).expect("time to be simple"),
                );
                entry.published(Some(chrono_bullshit));
            }

            if let Some(excerpt) = doc.summary.excerpt {
                entry.summary(
                    atom_syndication::TextBuilder::default()
                        .value(excerpt.to_string())
                        .build(),
                );
            }

            entry.build()
        })
        .collect::<Vec<_>>();

    let feed = atom_syndication::FeedBuilder::default()
        .title("Blake Rain")
        .id("https://blakerain.com")
        .subtitle(Some(
            atom_syndication::TextBuilder::default()
                .value("Feed of blog posts on Blake Rain's website")
                .build(),
        ))
        .logo(Some(
            "https://blakerain.com/media/logo-text.png".to_string(),
        ))
        .icon(Some("https://blakerain.com/favicon.png".to_string()))
        .rights(Some(
            atom_syndication::TextBuilder::default()
                .value(format!("All Right Reserved {}, Blake Rain", now.year()))
                .build(),
        ))
        .updated(now)
        .author(
            atom_syndication::PersonBuilder::default()
                .name("Blake Rain")
                .email(Some("blake.rain@blakerain.com".to_string()))
                .uri(Some("https://blakerain.com".to_string()))
                .build(),
        )
        .link(
            atom_syndication::LinkBuilder::default()
                .rel("alternate")
                .href("https://blakerain.com")
                .build(),
        )
        .link(
            atom_syndication::LinkBuilder::default()
                .rel("self")
                .href("https://blakerain.com/feeds/atom.xml")
                .build(),
        )
        .entries(items)
        .build();

    let mut result = Vec::new();
    feed.write_to(&mut result).expect("Atom");

    env.write_u8("feeds/atom.xml", &result).await
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize the logger for the site application
    env_logger::init();

    // Create our environment.
    let env = Env::new().await?;

    // Render all the routes.
    render_routes(&env).await?;

    // Copy over all the other resources.
    copy_resources(&env).await?;

    // Generate the sitemap.
    generate_sitemap(&env).await?;

    // Generate the feeds.
    generate_rss(&env).await?;
    generate_atom(&env).await?;

    Ok(())
}
