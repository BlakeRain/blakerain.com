use std::path::PathBuf;

use anyhow::Context;
use blakerain_com::{
    parse::load_frontmatter_and_source,
    tracing::setup_tracing,
    types::{Page, PageMetadata},
};
use clap::Parser;

#[derive(Parser)]
struct Args {
    /// Enable logging ('-v' for debug, '-vv' for tracing)
    #[clap(short = 'v', long, action = clap::ArgAction::Count, global = true, env)]
    pub verbose: u8,

    /// Enable ANSI formatting in output (i.e. colours)
    #[arg(long, env)]
    pub ansi: Option<bool>,

    /// The output path to write the JSON to
    #[arg(short, long, env)]
    pub output: Option<PathBuf>,

    /// The path to the HTML file to parse
    pub html: PathBuf,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    setup_tracing(args.ansi, Some(args.verbose));

    let metadata = std::fs::metadata(&args.html).context("failed to stat HTML file")?;
    let (frontmatter, source) = load_frontmatter_and_source(&args.html)?;

    let path = args.html.strip_prefix("content").unwrap_or(&args.html);

    let base = path.parent().map(PathBuf::from).unwrap_or(PathBuf::new());

    let summary_text = frontmatter
        .get("summary")
        .cloned()
        .unwrap_or(serde_json::Value::Null);
    let summary_text = summary_text.as_str().map(String::from);

    let page = Page {
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
        summary_text,
        toc: Vec::new(),
        content: source.join("\n"),
        word_count: 0,
        reading_time: 0,
    };

    if let Some(path) = args.output {
        std::fs::write(path, serde_json::to_string_pretty(&page)?)
            .context("failed to write JSON")?;
    } else {
        serde_json::to_writer_pretty(std::io::stdout(), &page).context("failed to write JSON")?;
    }

    Ok(())
}
