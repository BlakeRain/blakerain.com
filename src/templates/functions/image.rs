use minijinja::{Error, ErrorKind, State, Value};

use crate::images;

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

    let path = images::process(base, src, &spec).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to process image {src:?}: {err:#}"),
        )
    })?;

    Ok(minijinja::context! { path })
}
