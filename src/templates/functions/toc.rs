use minijinja::{Error, ErrorKind, State, Value};

use super::super::render_toc_html;

pub fn toc(state: &State) -> Result<Value, Error> {
    let Some(page) = state.lookup("page") else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "page not available",
        ));
    };

    let toc = page.get_attr("toc")?;
    if toc.is_undefined() || toc.is_none() {
        return Ok(Value::from_safe_string(String::new()));
    }

    let html = render_toc_html(state.env(), &toc).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to render TOC: {err:#}"),
        )
    })?;

    Ok(Value::from_safe_string(html))
}
