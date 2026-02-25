use std::path::Path;

use minijinja::{path_loader, Environment};

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
    filters::add_filters(&mut env);
    functions::add_functions(&mut env);

    Ok(env)
}
