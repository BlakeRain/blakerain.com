use std::path::PathBuf;

use minijinja::{Error, ErrorKind, State};

pub fn base_url(state: &State, url: String) -> Result<String, Error> {
    let Some(site) = state.lookup("site") else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "site not available",
        ));
    };

    let base_url = site.get_attr("base_url")?;
    let base_url = base_url.as_str().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidOperation,
            "base_url not available or not a string",
        )
    })?;

    let base_url = base_url.strip_suffix('/').unwrap_or(base_url);
    let url = url.as_str();
    let url = url.strip_prefix('/').unwrap_or(url);

    Ok(format!("{}/{}", base_url, url))
}

pub fn path_parent(path: &str) -> Result<String, Error> {
    let path = PathBuf::from(path);
    let parent = path.parent().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("path has no parent: {:?}", path),
        )
    })?;

    Ok(parent.to_string_lossy().to_string())
}

pub fn file_exists(path: &str) -> Result<bool, Error> {
    Ok(PathBuf::from(path).is_file())
}
