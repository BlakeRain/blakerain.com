use std::path::Path;

use anyhow::Context;
use minijinja::{path_loader, Environment, Value};

mod filters;
mod functions;

pub fn load_templates<P: AsRef<Path>>(path: P) -> anyhow::Result<Environment<'static>> {
    let path = path.as_ref();

    if !path.is_dir() {
        tracing::error!(?path, "templates path is not a directory");
        return Err(anyhow::anyhow!(
            "templates path is not a directory: {}",
            path.display()
        ));
    }

    let mut env = Environment::new();
    env.set_loader(path_loader(path));
    filters::register(&mut env);
    functions::register(&mut env);

    Ok(env)
}

pub fn render_toc_html(env: &Environment, items: &Value) -> anyhow::Result<String> {
    if items.is_undefined() || items.is_none() {
        return Ok(String::new());
    }

    if items.len().unwrap_or(0) == 0 {
        return Ok(String::new());
    }

    env.get_template("toc.html")
        .context("failed to load TOC template")?
        .render(minijinja::context! { items => items })
        .context("failed to render TOC template")
}
