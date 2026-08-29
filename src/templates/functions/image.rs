use minijinja::{Error, ErrorKind, State, Value};

use crate::images;

fn site_attr(state: &State, name: &str) -> Result<Option<String>, Error> {
    let Some(site) = state.lookup("site") else {
        return Ok(None);
    };

    let value = site.get_attr(name)?;
    Ok(value.as_str().map(String::from))
}

pub fn image(state: &State, src: &str, spec: &str) -> Result<Value, Error> {
    let Some(page) = state.lookup("page") else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "page not available",
        ));
    };

    let base = page.get_attr("base")?;
    let base = base.as_str().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidOperation,
            "base not available or not a string",
        )
    })?;

    let spec = images::parse_spec(spec).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("invalid image spec {spec:?}: {err:#}"),
        )
    })?;

    let mut path = images::process(base, src, &spec).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to process image {src:?}: {err:#}"),
        )
    })?;

    if site_attr(state, "target")?.as_deref() == Some("rss")
        && let Some(base_url) = site_attr(state, "base_url")?
    {
        path = format!("{}{}", base_url.trim_end_matches('/'), path);
    }

    Ok(minijinja::context! { path })
}
