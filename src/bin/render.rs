use std::{
    io::{Read, Write},
    path::PathBuf,
};

use anyhow::Context;
use blakerain_com::{
    parsing::yaml::{load_yaml, parse_yaml},
    templates::load_templates,
    tracing::setup_tracing,
};
use clap::Parser;
use minify_html::Cfg;
use serde_json::Value;
use time::OffsetDateTime;

#[derive(Parser)]
pub struct Args {
    /// Enable logging ('-v' for debug, '-vv' for tracing)
    #[clap(short = 'v', long, action = clap::ArgAction::Count, global = true, env)]
    pub verbose: u8,

    /// Enable ANSI formatting in output (i.e. colours)
    #[arg(long, env)]
    pub ansi: Option<bool>,

    /// Parse the input as YAML
    #[arg(long, env)]
    pub yaml: bool,

    /// Override the base URL from the site config
    #[arg(long, env)]
    pub base_url: Option<String>,

    /// The output path to write the JSON to
    #[arg(short, long, env)]
    pub output: Option<PathBuf>,

    /// Whether to minify the output
    #[arg(long, env)]
    pub minify: bool,

    /// Path to the directory containing the templates
    #[arg(long, env)]
    pub templates: Option<PathBuf>,

    /// The path to the template to use for rendering
    pub template: String,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    setup_tracing(args.ansi, Some(args.verbose));

    let site = load_yaml("site.yaml")?;

    tracing::info!("loading template from {:?}", args.template);
    let templates = args.templates.unwrap_or_else(|| PathBuf::from("templates"));
    let templates = load_templates(templates).context("failed to load templates")?;
    let template = templates
        .get_template(&args.template)
        .context("failed to find template")?;

    let page = if args.yaml {
        let mut input = String::new();
        std::io::stdin()
            .read_to_string(&mut input)
            .context("failed to read from stdin")?;
        parse_yaml(&input).context("failed to parse YAML")?
    } else {
        serde_json::from_reader::<_, Value>(std::io::stdin())
            .context("failed to parse standard input as JSON")?
    };

    let result = template
        .render(minijinja::context! {
            site,
            page,
            env => minijinja::context! {
                now => OffsetDateTime::now_utc(),
                today => OffsetDateTime::now_utc().date(),
            },
        })
        .context("failed to render template")?;

    let result = if args.minify {
        let result = result.as_bytes();
        let mut cfg = Cfg::new();
        cfg.keep_comments = true;
        minify_html::minify(result, &cfg)
    } else {
        result.as_bytes().to_vec()
    };

    if let Some(path) = args.output {
        std::fs::write(path, result).context("failed to write to output file")?;
    } else {
        std::io::stdout()
            .write_all(&result)
            .context("failed to write to standard output")?;
    }

    Ok(())
}
