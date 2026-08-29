use std::path::PathBuf;

use anyhow::Context;
use blakerain_com::{
    parse::load_frontmatter_and_source,
    render::render,
    templates::load_templates,
    tracing::setup_tracing,
    types::{Page, PageMetadata, Site},
};
use clap::Parser;
use time::OffsetDateTime;

/// Estimated reading speed used to compute a page's reading time.
const WORDS_PER_MINUTE: usize = 200;

#[derive(Parser)]
struct Args {
    /// Enable logging ('-v' for debug, '-vv' for tracing)
    #[clap(short = 'v', long, action = clap::ArgAction::Count, global = true, env)]
    pub verbose: u8,

    /// Enable ANSI formatting in output (i.e. colours)
    #[arg(long, env)]
    pub ansi: Option<bool>,

    /// Override the base URL from the site configuration
    #[arg(long, env)]
    pub base_url: Option<String>,

    /// The path to the directory containing our templates
    #[arg(long, env)]
    pub templates: Option<PathBuf>,

    /// The rendering target (e.g. "html" or "rss")
    #[arg(long, default_value = "html")]
    pub target: String,

    /// The output path to write the JSON to
    #[arg(short, long, env)]
    pub output: Option<PathBuf>,

    /// The path to the Markdown file to parse
    pub markdown: PathBuf,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    setup_tracing(args.ansi, Some(args.verbose));

    let metadata = std::fs::metadata(&args.markdown).context("failed to stat Markdown file")?;
    let (frontmatter, source) = load_frontmatter_and_source(&args.markdown)?;

    let path = args
        .markdown
        .strip_prefix("content")
        .unwrap_or(&args.markdown);

    let base = path.parent().map(PathBuf::from).unwrap_or(PathBuf::new());

    let mut page = Page {
        path: path.to_path_buf(),
        base,
        name: path
            .file_stem()
            .context("failed to get file stem")?
            .to_string_lossy()
            .to_string(),
        metadata: PageMetadata::try_from(metadata).context("failed to get page metadata")?,
        frontmatter,
        summary: None,
        summary_text: None,
        toc: Vec::new(),
        content: String::new(),
        word_count: 0,
        reading_time: 0,
    };

    let site = Site::load("site.yaml")
        .context("failed to load site configuration")?
        .with_target(&args.target);

    let source = source.join("\n");
    let templates = args.templates.unwrap_or_else(|| PathBuf::from("templates"));
    let templates = load_templates(templates).context("failed to load templates")?;
    let template_name = path.file_name().unwrap().to_string_lossy().to_string();
    let template = templates
        .template_from_named_str(&template_name, &source)
        .context("failed to create page template")?;

    let source = template
        .render(minijinja::context! {
            page,
            site,
            env => minijinja::context! {
                now => OffsetDateTime::now_utc(),
                today => OffsetDateTime::now_utc().date(),
                profile => env!("CARGO_PROFILE"),
                version => env!("CARGO_PKG_VERSION"),
            },
        })
        .context("failed to render page as template")?;

    let options = pulldown_cmark::Options::all();
    let parser = pulldown_cmark::Parser::new_ext(&source, options);
    let parser = pulldown_cmark::utils::TextMergeWithOffset::new(parser.into_offset_iter());
    let rendered = render(&templates, &page.base.to_string_lossy(), &site, parser)
        .context("failed to render page as markdown")?;

    {
        page.summary = rendered.summary;
        page.summary_text = rendered.summary_text;
        page.content = rendered.content;
        page.toc = rendered.toc;
        page.word_count = rendered.word_count;
        page.reading_time = rendered.word_count.div_ceil(WORDS_PER_MINUTE);
    }

    if let Some(path) = args.output {
        std::fs::write(path, serde_json::to_string_pretty(&page)?)
            .context("failed to write JSON")?;
    } else {
        serde_json::to_writer_pretty(std::io::stdout(), &page).context("failed to write JSON")?;
    }

    Ok(())
}
