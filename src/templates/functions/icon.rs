use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, LazyLock, Mutex, OnceLock},
};

use minijinja::{Error, ErrorKind, Value, value::Kwargs};
use regex::Regex;

static SVG_TAG_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<svg[^>]*>").expect("failed to compile SVG tag regex"));

static SVG_DIMENSION_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"\s+(width|height)\s*=\s*("[^"]*"|'[^']*')"#)
        .expect("failed to compile SVG dimension regex")
});

pub fn icon(vendor: &str, name: &str, kwargs: Kwargs) -> Result<Value, Error> {
    #[allow(clippy::type_complexity)]
    static ICON_CACHE: OnceLock<Arc<Mutex<HashMap<(String, String), String>>>> = OnceLock::new();

    let cache = ICON_CACHE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));
    let mut cache = cache.lock().expect("failed to lock icon cache");
    let key = (String::from(vendor), String::from(name));
    let color = kwargs.get::<Option<String>>("color")?;
    let size = kwargs.get::<Option<String>>("size")?;

    fn apply_args(icon: &str, color: Option<String>, size: Option<String>) -> Value {
        let mut args = vec![String::from("fill=\"currentColor\"")];

        if let Some(color) = color {
            args.push(format!("style=\"color:{color}\""));
        }

        if let Some(size) = size {
            args.push(format!("width=\"{size}\" height=\"{size}\""));
        } else {
            args.push(String::from("width=\"1em\" height=\"1em\""));
        }

        let icon = SVG_TAG_RE
            .replace(icon, |caps: &regex::Captures| {
                let tag = caps.get(0).expect("SVG tag").as_str();

                if let Some((left, right)) = tag.split_once('>') {
                    format!("{left} {}>{right}", args.join(" "))
                } else {
                    tag.to_string()
                }
            })
            .into_owned();

        Value::from_safe_string(icon)
    }

    if let Some(icon) = cache.get(&key) {
        return Ok(apply_args(icon, color, size));
    }

    let icon_path = PathBuf::from(match vendor {
        "bootstrap" => format!("node_modules/bootstrap-icons/icons/{name}.svg"),
        "lucide" => format!("node_modules/lucide-static/icons/{name}.svg"),
        "simple-icons" => format!("node_modules/simple-icons/icons/{name}.svg"),
        _ => {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!("unrecognised icon vendor {:?}", vendor),
            ));
        }
    });

    if !icon_path.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("icon not found at {:?}", icon_path),
        ));
    }

    tracing::info!("loading icon from {:?}", icon_path);
    let contents = std::fs::read_to_string(&icon_path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to read icon at {:?}: {}", icon_path, err),
        )
    })?;

    let icon = contents.trim();

    let icon = SVG_TAG_RE
        .replace(icon, |caps: &regex::Captures| {
            let tag = caps.get(0).expect("SVG tag").as_str();
            SVG_DIMENSION_RE.replace_all(tag, "").into_owned()
        })
        .into_owned();

    let icon = minify_html::minify(icon.as_bytes(), &minify_html::Cfg::default());
    let icon = String::from_utf8(icon).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse minified icon as UTF-8: {err}"),
        )
    })?;

    cache.insert(key, icon.clone());

    Ok(apply_args(&icon, color, size))
}
