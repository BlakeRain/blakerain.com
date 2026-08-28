use std::path::PathBuf;

use anyhow::Context;
use minijinja::{Error, ErrorKind, Value};

use crate::parsing::{toml::parse_toml, yaml::parse_yaml};

pub fn load_data(path: &str) -> Result<Value, Error> {
    let path = PathBuf::from(path);

    if !path.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("data not found at {:?}", path),
        ));
    }

    let Some(extension) = path.extension().and_then(|ext| ext.to_str()) else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("no extension on data file at {:?}", path,),
        ));
    };

    let contents = std::fs::read_to_string(&path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to read data file at {:?}: {}", path, err),
        )
    })?;

    match extension {
        "yaml" => parse_yaml(&contents).map(Value::from_serialize),
        "toml" => parse_toml(&contents).map(Value::from_serialize),
        "json" => serde_json::from_str::<Value>(&contents).context("failed to parse JSON"),

        _ => {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!(
                    "unrecognized extension {:?} on data file at {:?}",
                    extension, path
                ),
            ));
        }
    }
    .map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse data at {:?}: {}", path, err),
        )
    })
}

pub fn load_page(path: &str) -> Result<Value, Error> {
    let mut path = PathBuf::from(path);
    path.add_extension("json");
    let path = PathBuf::from("build/content").join(path);

    if !path.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("page not found at {:?}", path),
        ));
    }

    let contents = std::fs::read_to_string(&path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to read page at {:?}: {}", path, err),
        )
    })?;

    serde_json::from_str(&contents).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse page at {:?}: {}", path, err),
        )
    })
}

pub fn load_pages(path: &str) -> Result<Value, Error> {
    let path = PathBuf::from(path);
    let path = PathBuf::from("build/content").join(path);

    if !path.is_dir() {
        tracing::error!(?path, "pages path is not a directory");

        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("pages not found at {:?}", path),
        ));
    }

    tracing::info!(?path, "loading pages");

    let mut pages = Vec::new();
    for entry in walkdir::WalkDir::new(&path)
        .into_iter()
        .filter_map(|entry| entry.ok())
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        tracing::info!(?path, "loading page");

        let contents = std::fs::read_to_string(&path).map_err(|err| {
            tracing::error!(?path, ?err, "failed to read page");

            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to read page at {:?}: {}", path, err),
            )
        })?;

        let page = serde_json::from_str::<Value>(&contents).map_err(|err| {
            tracing::error!(?path, ?err, "failed to parse page");

            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to parse page at {:?}: {}", path, err),
            )
        })?;

        pages.push(page);
    }

    Ok(Value::from(pages))
}

pub fn list_files(path: &str) -> Result<Value, Error> {
    let path = PathBuf::from(path);

    if !path.is_dir() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("directory not found at {path:?}"),
        ));
    }

    let mut files = Vec::new();
    for entry in std::fs::read_dir(&path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to read directory at {path:?}: {err}"),
        )
    })? {
        let entry = entry.map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to read directory entry in {path:?}: {err}"),
            )
        })?;

        if !entry.file_type().map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to stat directory entry in {path:?}: {err}"),
            )
        })?.is_file()
        {
            continue;
        }

        files.push(entry.file_name().to_string_lossy().to_string());
    }

    files.sort();

    Ok(Value::from(files))
}
