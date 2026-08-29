use std::path::PathBuf;

use anyhow::Context;
use minijinja::{Error, ErrorKind, Value};

use crate::{
    parsing::{toml::parse_toml, yaml::parse_yaml},
    types::Page,
};

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

    let page = Page::load(&path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to load page at {:?}: {}", path, err),
        )
    })?;

    Ok(Value::from_serialize(page))
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
    let pages = Page::load_all(&path).map_err(|err| {
        tracing::error!(?path, ?err, "failed to load pages");

        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to load pages at {:?}: {}", path, err),
        )
    })?;

    Ok(Value::from_serialize(pages))
}

pub fn related(
    section: &str,
    tags: Value,
    exclude_base: &str,
    limit: usize,
) -> Result<Value, Error> {
    let tags: Vec<String> = if tags.is_undefined() {
        return Ok(Value::from(Vec::<Value>::new()));
    } else {
        match tags.try_iter() {
            Ok(tags) => tags
                .filter_map(|tag| tag.as_str().map(String::from))
                .collect(),
            Err(_) => return Ok(Value::from(Vec::<Value>::new())),
        }
    };

    if tags.is_empty() {
        return Ok(Value::from(Vec::<Value>::new()));
    }

    let path = PathBuf::from("build").join("content").join(section);
    let pages = Page::load_all(&path).map_err(|err| {
        tracing::error!(?path, ?err, "failed to load pages");

        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to load pages at {:?}: {}", path, err),
        )
    })?;

    let mut scored = Vec::new();
    for page in pages {
        let Some(date) = page.get_date() else {
            continue;
        };

        if page.base.to_str() == Some(exclude_base) {
            continue;
        }

        let page_tags = page.get_tags();
        if page_tags.is_empty() {
            continue;
        }

        let score = tags.iter().filter(|tag| page_tags.contains(tag)).count();
        if score == 0 {
            continue;
        }

        scored.push((score, date, page));
    }

    scored.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| b.1.cmp(&a.1)));

    let related = scored
        .into_iter()
        .take(limit)
        .map(|(_, _, page)| page)
        .collect::<Vec<_>>();

    Ok(Value::from_serialize(related))
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

        if !entry
            .file_type()
            .map_err(|err| {
                Error::new(
                    ErrorKind::InvalidOperation,
                    format!("failed to stat directory entry in {path:?}: {err}"),
                )
            })?
            .is_file()
        {
            continue;
        }

        files.push(entry.file_name().to_string_lossy().to_string());
    }

    files.sort();

    Ok(Value::from(files))
}
