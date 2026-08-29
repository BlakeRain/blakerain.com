use anyhow::Context;
use clap::Parser;
use two_face::{
    re_exports::syntect::html::{ClassStyle, css_for_theme_with_class_style},
    theme::{EmbeddedThemeName, extra},
};

#[derive(Debug, Parser)]
struct Args {
    #[command(subcommand)]
    mode: Mode,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, clap::Subcommand)]
enum Mode {
    Dark,
    Light,
}

impl Mode {
    fn get_theme(self) -> EmbeddedThemeName {
        match self {
            Self::Dark => EmbeddedThemeName::CatppuccinMocha,
            Self::Light => EmbeddedThemeName::CatppuccinLatte,
        }
    }
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();
    let theme = args.mode.get_theme();
    let themes = extra();
    let theme = themes.get(theme);
    let css = css_for_theme_with_class_style(theme, ClassStyle::SpacedPrefixed { prefix: "syn-" })
        .context("failed to generate CSS")?;

    if args.mode == Mode::Dark {
        println!("@media (prefers-color-scheme: dark) {{");
        println!("{css}");
        println!("}}");
    } else {
        println!("{css}");
    }

    Ok(())
}
