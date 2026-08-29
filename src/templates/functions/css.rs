use std::path::PathBuf;

use minijinja::{Error, ErrorKind, value::Kwargs};

pub fn css(path: &str, options: Kwargs) -> Result<String, Error> {
    let path = PathBuf::from(path);

    if !path.is_file() {
        tracing::error!(?path, "CSS file not found");

        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("CSS file not found at {:?}", path),
        ));
    }

    let output_url = match options.get::<Option<&str>>("output")? {
        Some(output) => PathBuf::from(output),
        None => path.clone(),
    };

    let output_path = PathBuf::from("output").join(&output_url);

    tracing::info!(?output_path, "writing CSS file");

    let status = std::process::Command::new("pnpm")
        .arg("postcss")
        .arg(path)
        .arg("--output")
        .arg(output_path)
        .status()
        .map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to run pnpm postcss: {err}"),
            )
        })?;

    if !status.success() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to run pnpm postcss: {status:?}"),
        ));
    }

    Ok(output_url.to_string_lossy().to_string())
}
