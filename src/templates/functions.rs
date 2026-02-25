use std::{
    collections::HashMap,
    path::PathBuf,
    str::FromStr,
    sync::{Arc, LazyLock, Mutex, OnceLock},
};

use anyhow::Context;
use base64::Engine;
use image::ImageReader;
use minijinja::{
    value::{Kwargs, Rest},
    Environment, Error, ErrorKind, State, Value,
};
use regex::Regex;
use serde::Serialize;
use sha2::{Digest, Sha256};

use crate::parsing::{toml::parse_toml, yaml::parse_yaml};

pub fn add_functions(environment: &mut Environment) {
    environment.add_function("assign", assign);
    environment.add_function("base_url", base_url);
    environment.add_function("file_exists", file_exists);
    environment.add_function("icon", icon);
    environment.add_function("image_process", image_process);
    environment.add_function("load_data", load_data);
    environment.add_function("load_page", load_page);
    environment.add_function("load_pages", load_pages);
    environment.add_function("path_parent", path_parent);
    environment.add_function("repeat", repeat);
}

fn base_url(state: &State, url: String) -> Result<String, Error> {
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

fn path_parent(path: &str) -> Result<String, Error> {
    let path = PathBuf::from(path);
    let parent = path.parent().ok_or_else(|| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("path has no parent: {:?}", path),
        )
    })?;

    Ok(parent.to_string_lossy().to_string())
}

fn file_exists(path: &str) -> Result<bool, Error> {
    Ok(PathBuf::from(path).is_file())
}

fn assign(value: Value, args: Rest<Value>) -> Result<Value, Error> {
    let mut obj = if value.is_undefined() {
        HashMap::new()
    } else if let Some(obj) = value.as_object() {
        obj.try_iter_pairs().into_iter().flatten().collect()
    } else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "value is not an object",
        ));
    };

    let mut args = args.0.into_iter();

    loop {
        let Some(key) = args.next() else {
            break;
        };

        let Some(value) = args.next() else {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!("expected value for key {:?}", key),
            ));
        };

        obj.insert(key, value);
    }

    Ok(Value::from_object(obj))
}

static SVG_TAG_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"(?s)<svg[^>]*>").expect("failed to compile SVG tag regex"));

static SVG_DIMENSION_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"\s+(width|height)\s*=\s*("[^"]*"|'[^']*')"#)
        .expect("failed to compile SVG dimension regex")
});

// TODO: Embed the icons directly in the binary?
fn icon(vendor: &str, name: &str, kwargs: Kwargs) -> Result<Value, Error> {
    static ICON_CACHE: OnceLock<Arc<Mutex<HashMap<(String, String), String>>>> = OnceLock::new();

    let cache = ICON_CACHE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));
    let mut cache = cache.lock().expect("failed to lock icon cache");
    let key = (vendor.to_string(), name.to_string());
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
            args.push(format!("width=\"1em\" height=\"1em\""));
        }

        if args.is_empty() {
            return Value::from_safe_string(String::from(icon));
        }

        let icon = SVG_TAG_RE
            .replace(&icon, |caps: &regex::Captures| {
                let tag = caps.get(0).expect("SVG tag").as_str();

                if let Some((left, right)) = tag.split_once('>') {
                    format!("{left} {}>{right}", args.join(" "))
                } else {
                    tag.to_string()
                }
            })
            .into_owned();

        Value::from_safe_string(String::from(icon))
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

    // Remove the `width=` and `height=` attributes from the icon.
    let icon = SVG_TAG_RE
        .replace(&icon, |caps: &regex::Captures| {
            let tag = caps.get(0).expect("SVG tag").as_str();
            SVG_DIMENSION_RE.replace_all(tag, "").into_owned()
        })
        .into_owned();

    let icon = minify_html::minify(icon.as_bytes(), &minify_html::Cfg::default());
    let icon = String::from_utf8(icon).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse minified icon: {err}"),
        )
    })?;

    cache.insert(key, icon.clone());

    Ok(apply_args(&icon, color, size))
}

fn load_page(path: &str) -> Result<Value, Error> {
    let mut path = PathBuf::from(path);
    path.add_extension("json");
    let path = PathBuf::from("build/content").join(path);

    if !path.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("page not found at {:?}", path),
        ));
    }

    let contents = match std::fs::read_to_string(&path) {
        Ok(contents) => contents,
        Err(err) => {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to read page at {:?}: {}", path, err),
            ))
        }
    };

    serde_json::from_str(&contents).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse page at {:?}: {}", path, err),
        )
    })
}

fn load_pages(path: &str) -> Result<Value, Error> {
    let path = PathBuf::from(path);
    let path = PathBuf::from("build/content").join(path);

    if !path.is_dir() {
        tracing::error!(?path, "path is not a directory");

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

        let contents = match std::fs::read_to_string(&path) {
            Ok(contents) => contents,
            Err(err) => {
                tracing::error!(?path, ?err, "failed to read page");

                return Err(Error::new(
                    ErrorKind::InvalidOperation,
                    format!("failed to read page at {:?}: {}", path, err),
                ));
            }
        };

        pages.push(serde_json::from_str::<Value>(&contents).map_err(|err| {
            tracing::error!(?path, ?err, "failed to parse page");

            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to parse page at {:?}: {}", path, err),
            )
        })?);
    }

    Ok(Value::from(pages))
}

fn load_data(path: &str) -> Result<Value, Error> {
    let path = PathBuf::from("data").join(path);

    if !path.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("data not found at {:?}", path),
        ));
    }

    let Some(extension) = path.extension().and_then(|ext| ext.to_str()) else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("no extension on data file at {:?}", path),
        ));
    };

    let contents = std::fs::read_to_string(&path).map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to read data at {:?}: {}", path, err),
        )
    })?;

    let contents = match extension {
        "yaml" => parse_yaml(&contents).map(Value::from_serialize),
        "toml" => parse_toml(&contents).map(Value::from_serialize),
        "json" => serde_json::from_str::<Value>(&contents).context("failed to parse JSON"),

        _ => {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!(
                    "unrecognised extension {:?} on data file at {:?}",
                    extension, path
                ),
            ))
        }
    };

    contents.map_err(|err| {
        Error::new(
            ErrorKind::InvalidOperation,
            format!("failed to parse data at {:?}: {}", path, err),
        )
    })
}

#[derive(Debug, Serialize)]
struct ImageSpec {
    width: Option<u32>,
    height: Option<u32>,
    quality: Option<u32>,
}

impl FromStr for ImageSpec {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut width = None;
        let mut height = None;
        let mut quality = None;

        for part in s.split_whitespace() {
            if let Some((prefix, rest)) = part.split_at_checked(1) {
                match prefix {
                    "w" => match rest.parse::<u32>() {
                        Ok(value) => width = Some(value),
                        Err(err) => {
                            return Err(Error::new(
                                ErrorKind::InvalidOperation,
                                format!("invalid number in width specifier {part:?}: {err:}"),
                            ))
                        }
                    },

                    // copy-paste repeat myself, copy-paste repeat myself, ...
                    "h" => match rest.parse::<u32>() {
                        Ok(value) => height = Some(value),
                        Err(err) => {
                            return Err(Error::new(
                                ErrorKind::InvalidOperation,
                                format!("invalid number in height specifier {part:?}: {err:}"),
                            ))
                        }
                    },

                    "q" => match rest.parse::<u32>() {
                        Ok(value) => quality = Some(value),
                        Err(err) => {
                            return Err(Error::new(
                                ErrorKind::InvalidOperation,
                                format!("invalid number in quality specifier {part:?}: {err:}"),
                            ))
                        }
                    },

                    _ => {
                        return Err(Error::new(
                            ErrorKind::InvalidOperation,
                            format!("unrecognised image specifier {part:?}"),
                        ))
                    }
                }
            } else {
                return Err(Error::new(
                    ErrorKind::InvalidOperation,
                    format!("unrecognised image specifier {part:?}"),
                ));
            }
        }

        Ok(Self {
            width,
            height,
            quality,
        })
    }
}

fn image_process(state: &State, src: &str, spec: &str) -> Result<Value, Error> {
    let src = PathBuf::from(src);

    // If the image path is relative, then it's relative to the path of the page we're rendering.
    // This means we need to fetch the page's path from the 'state'.
    let (src_path, src) = if src.is_relative() {
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

        (
            PathBuf::from("content").join(PathBuf::from(base).join(&src)),
            PathBuf::from(base).join(src),
        )
    } else {
        // Otherwise the image path is absolute, which we don't want.
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image path is absolute: {:?}", src),
        ));
    };

    let Ok(metadata) = std::fs::metadata(&src_path) else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image not found at {:?}", src_path),
        ));
    };

    if !metadata.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image is not a file: {:?}", src_path),
        ));
    }

    let spec = ImageSpec::from_str(spec)?;

    let (output_path, output_url) = {
        let mut hasher = Sha256::new();
        hasher.update(src.to_string_lossy().as_bytes());

        if let Some(width) = spec.width {
            hasher.update(width.to_be_bytes());
        }

        if let Some(height) = spec.height {
            hasher.update(height.to_be_bytes());
        }

        if let Some(quality) = spec.quality {
            hasher.update(quality.to_be_bytes());
        }

        let hash = hasher.finalize();
        let hash = base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(hash);
        let filename = src
            .file_stem()
            .expect("image path has a filename")
            .to_string_lossy();
        let filename = PathBuf::from(format!("{filename}_{hash}"));

        let filename = if src.extension().map_or(false, |ext| ext == "gif") {
            filename.with_extension("gif")
        } else {
            filename.with_extension("webp")
        };

        let output_url = if let Some(parent) = src.parent() {
            parent.join(filename)
        } else {
            PathBuf::from(filename)
        };

        let output_path = PathBuf::from("output").join(&output_url);

        (output_path, format!("/{}", output_url.to_string_lossy()))
    };

    if let Ok(output_metadata) = std::fs::metadata(&output_path) {
        if !output_metadata.is_file() {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!("output path is not a file: {:?}", output_path),
            ));
        }

        let src_mtime = metadata.modified().expect("failed to get modified time");
        let output_mtime = output_metadata
            .modified()
            .expect("failed to get modified time");

        if output_metadata.len() > 0 && src_mtime <= output_mtime {
            tracing::info!(?src, "reusing already generated image");

            return Ok(minijinja::context! {
                src,
                spec,
                path => output_url,
            });
        }
    }

    if let Some(output_parent) = output_path.parent() {
        std::fs::create_dir_all(output_parent).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!(
                    "failed to create output directory at {:?}: {}",
                    output_parent, err
                ),
            )
        })?;
    }

    // Short circuit if the image is a GIF.
    if src_path.extension().map_or(false, |ext| ext == "gif") {
        // Just copy the image to the output directory.
        std::fs::copy(&src_path, &output_path).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to copy image at {:?}: {}", src_path, err),
            )
        })?;

        return Ok(minijinja::context! {
            src,
            spec,
            path => output_url,
        });
    }

    tracing::info!(?src_path, "reading image");
    let image = ImageReader::open(&src_path)
        .map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to read image at {:?}: {}", src_path, err),
            )
        })?
        .decode()
        .map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to decode image at {:?}: {}", src_path, err),
            )
        })?;

    {
        let encoder = webp::Encoder::from_image(&image).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to encode image at {:?}: {}", src_path, err),
            )
        })?;

        tracing::info!(?output_path, "writing image");
        let webp = encoder.encode(spec.quality.unwrap_or(90) as f32);
        std::fs::write(&output_path, &*webp).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to write image at {:?}: {}", output_path, err),
            )
        })?;
    }

    Ok(minijinja::context! {
        src,
        spec,
        path => output_url,
    })
}

fn repeat(value: &str, count: usize) -> Result<Value, Error> {
    Ok(value.repeat(count).into())
}
