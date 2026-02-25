use std::{
    io::{BufRead, BufReader},
    path::PathBuf,
};

use anyhow::Context;
use blakerain_com::{
    parsing::{frontmatter::parse_frontmatter, yaml::load_yaml},
    render::render,
    templates::load_templates,
    tracing::setup_tracing,
};
use clap::Parser;
use time::OffsetDateTime;

#[derive(Parser)]
pub struct Args {
    /// Enable logging ('-v' for debug, '-vv' for tracing)
    #[clap(short = 'v', long, action = clap::ArgAction::Count, global = true, env)]
    pub verbose: u8,

    /// Enable ANSI formatting in output (i.e. colours)
    #[arg(long, env)]
    pub ansi: Option<bool>,

    /// Override the base URL from the site config
    #[arg(long, env)]
    pub base_url: Option<String>,

    /// Path to the directory containing the templates
    #[arg(long, env)]
    pub templates: Option<PathBuf>,

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

    // Read the Markdown source from the file
    let source = BufReader::new(
        std::fs::File::open(&args.markdown).context("failed to open Markdown file")?,
    )
    .lines()
    .collect::<Result<Vec<_>, _>>()
    .context("failed to read Markdown file")?;

    let nlines = source.len();
    let (frontmatter, source) = parse_frontmatter(source).context("failed to parse frontmatter")?;

    // Add blank lines to the front of the source to replace the missing lines.
    let source = if source.len() < nlines {
        std::iter::repeat_n(String::new(), nlines - source.len())
            .chain(source.into_iter())
            .collect::<Vec<_>>()
    } else {
        source
    };

    let path = args
        .markdown
        .strip_prefix("content")
        .unwrap_or(&args.markdown);

    let base = path.parent().map(PathBuf::from).unwrap_or(PathBuf::new());

    let site = load_yaml("site.yaml").context("failed to load site config")?;

    let mut page = serde_json::json!({
        "path": path.to_string_lossy().to_owned(),
        "base": base.to_string_lossy().to_owned(),
        "metadata": {
            "size": metadata.len(),
            "modified": OffsetDateTime::from(metadata.modified().context("failed to get modified time")?),
            "created": OffsetDateTime::from(metadata.created().context("failed to get created time")?),
        },
        "frontmatter": frontmatter,
    });

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
            env => minijinja::context! {
                now => OffsetDateTime::now_utc(),
                today => OffsetDateTime::now_utc().date(),
            },
            site,
        })
        .context("failed to render page as template")?;

    let options = pulldown_cmark::Options::all();
    let parser = pulldown_cmark::Parser::new_ext(&source, options);
    let parser = pulldown_cmark::utils::TextMergeWithOffset::new(parser.into_offset_iter());
    let rendered = render(&templates, parser).context("failed to render page as markdown")?;

    {
        let page = page.as_object_mut().expect("page to be a JSON object");

        page.insert(
            String::from("summary"),
            rendered
                .summary
                .map(serde_json::Value::String)
                .unwrap_or(serde_json::Value::Null),
        );

        page.insert(
            String::from("content"),
            serde_json::Value::String(rendered.content),
        );
    }

    if let Some(path) = args.output {
        std::fs::write(path, serde_json::to_string_pretty(&page)?)
            .context("failed to write JSON")?;
    } else {
        serde_json::to_writer_pretty(std::io::stdout(), &page).context("failed to write JSON")?;
    }

    Ok(())
}
