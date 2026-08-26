use std::{path::PathBuf, str::FromStr};

use base64::Engine;
use image::ImageReader;
use minijinja::{Error, ErrorKind, State, Value};
use serde::Serialize;
use sha2::{Digest, Sha256};

#[derive(Debug, Serialize)]
struct ImageSpec {
    width: Option<u32>,
    height: Option<u32>,
    quality: Option<u32>,
}

impl FromStr for ImageSpec {
    type Err = Error;

    fn from_str(src: &str) -> Result<Self, Self::Err> {
        let mut width = None;
        let mut height = None;
        let mut quality = None;

        for part in src.split_whitespace() {
            let Some((prefix, rest)) = part.split_at_checked(1) else {
                return Err(Error::new(
                    ErrorKind::InvalidOperation,
                    format!("unrecognized image specifier {part:?}"),
                ));
            };

            match prefix {
                "w" => match rest.parse::<u32>() {
                    Ok(value) => width = Some(value),
                    Err(err) => {
                        return Err(Error::new(
                            ErrorKind::InvalidOperation,
                            format!("invalid number in width specifier {part:?}: {err}"),
                        ));
                    }
                },

                "h" => match rest.parse::<u32>() {
                    Ok(value) => height = Some(value),
                    Err(err) => {
                        return Err(Error::new(
                            ErrorKind::InvalidOperation,
                            format!("invalid number in height specifier {part:?}: {err}"),
                        ));
                    }
                },

                "q" => match rest.parse::<u32>() {
                    Ok(value) => quality = Some(value),
                    Err(err) => {
                        return Err(Error::new(
                            ErrorKind::InvalidOperation,
                            format!("invalid number in quality specifier {part:?}: {err}"),
                        ));
                    }
                },

                _ => {
                    return Err(Error::new(
                        ErrorKind::InvalidOperation,
                        format!("unrecognized image specifier {part:?}"),
                    ));
                }
            }
        }

        Ok(Self {
            width,
            height,
            quality,
        })
    }
}

pub fn image(state: &State, src: &str, spec: &str) -> Result<Value, Error> {
    let src = PathBuf::from(src);

    // if the image path is relative, then it is relative to the path of the page we are rendering.
    // This means we need to fetch the page's path from the `state` object.
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
        // Otherwise, the image path is absolute, which we don't want.
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image path is absolute: {src:?}"),
        ));
    };

    let Ok(metadata) = std::fs::metadata(&src_path) else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image not found at {src_path:?}"),
        ));
    };

    if !metadata.is_file() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            format!("image is not a file: {src_path:?}"),
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

        let output_url = if let Some(parent) = src_path.parent() {
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
                format!("output path is not a file: {output_path:?}"),
            ));
        }

        let src_mtime = metadata.modified().expect("to get modified time");
        let output_mtime = output_metadata.modified().expect("to get modified time");

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
                format!("failed to create output parent directory at {output_parent:?}: {err}"),
            )
        })?;
    }

    if src_path.extension().map_or(false, |ext| ext == "gif") {
        std::fs::copy(&src_path, &output_path).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to copy image to output path at {output_path:?}: {err}"),
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
                format!("failed to read image at {src_path:?}: {err}"),
            )
        })?
        .decode()
        .map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to decode image at {src_path:?}: {err}"),
            )
        })?;

    {
        let encoder = webp::Encoder::from_image(&image).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to create WebP encoder: {err}"),
            )
        })?;

        tracing::info!(?output_path, "writing image");

        let webp = encoder.encode(spec.quality.unwrap_or(90) as f32);
        std::fs::write(&output_path, &*webp).map_err(|err| {
            Error::new(
                ErrorKind::InvalidOperation,
                format!("failed to write image at {output_path:?}: {err}"),
            )
        })?;
    }

    Ok(minijinja::context! {
        src,
        spec,
        path => output_url,
    })
}
