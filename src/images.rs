use std::path::PathBuf;

use anyhow::Context;
use base64::Engine;
use image::ImageReader;
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Default)]
pub struct ImageSpec {
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub quality: Option<u32>,
}

pub fn parse_spec(src: &str) -> anyhow::Result<ImageSpec> {
    let mut width = None;
    let mut height = None;
    let mut quality = None;

    for part in src.split_whitespace() {
        let Some((prefix, rest)) = part.split_at_checked(1) else {
            anyhow::bail!("unrecognized image specifier {part:?}");
        };

        match prefix {
            "w" => {
                width = Some(
                    rest.parse::<u32>()
                        .with_context(|| format!("invalid number in width specifier {part:?}"))?,
                )
            }
            "h" => {
                height = Some(
                    rest.parse::<u32>()
                        .with_context(|| format!("invalid number in height specifier {part:?}"))?,
                )
            }
            "q" => {
                quality = Some(
                    rest.parse::<u32>()
                        .with_context(|| format!("invalid number in quality specifier {part:?}"))?,
                )
            }
            _ => anyhow::bail!("unrecognized image specifier {part:?}"),
        }
    }

    Ok(ImageSpec {
        width,
        height,
        quality,
    })
}

/// Process an image located at `content/<base>/<src>`, writing the result into
/// `output/` and returning the output URL (e.g. `/blog/foo/bar_<hash>.webp`).
pub fn process(base: &str, src: &str, spec: &ImageSpec) -> anyhow::Result<String> {
    let src = src.strip_prefix("./").unwrap_or(src);
    let src = PathBuf::from(src);

    let src_path = PathBuf::from("content").join(PathBuf::from(base).join(&src));
    let src = PathBuf::from(base).join(src);

    let metadata =
        std::fs::metadata(&src_path).with_context(|| format!("image not found at {src_path:?}"))?;

    if !metadata.is_file() {
        anyhow::bail!("image is not a file: {src_path:?}");
    }

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
            .context("image path has a filename")?
            .to_string_lossy();
        let filename = PathBuf::from(format!("{filename}_{hash}"));

        let filename = if src.extension().is_some_and(|ext| ext == "gif") {
            filename.with_extension("gif")
        } else {
            filename.with_extension("webp")
        };

        let output_url = if let Some(parent) = src_path.parent() {
            parent.join(filename)
        } else {
            filename
        };

        let output_url = output_url
            .strip_prefix("content")
            .with_context(|| format!("failed to strip content prefix from {output_url:?}"))?;

        let output_path = PathBuf::from("output").join(output_url);

        (output_path, format!("/{}", output_url.to_string_lossy()))
    };

    if let Ok(output_metadata) = std::fs::metadata(&output_path) {
        if !output_metadata.is_file() {
            anyhow::bail!("output path is not a file: {output_path:?}");
        }

        let src_mtime = metadata.modified().context("failed to get modified time")?;
        let output_mtime = output_metadata
            .modified()
            .context("failed to get modified time")?;

        if output_metadata.len() > 0 && src_mtime <= output_mtime {
            tracing::debug!(?src, "reusing already generated image");

            return Ok(output_url);
        }
    }

    if let Some(output_parent) = output_path.parent() {
        std::fs::create_dir_all(output_parent).with_context(|| {
            format!("failed to create output parent directory at {output_parent:?}")
        })?;
    }

    if src_path.extension().is_some_and(|ext| ext == "gif") {
        std::fs::copy(&src_path, &output_path)
            .with_context(|| format!("failed to copy image to output path at {output_path:?}"))?;

        return Ok(output_url);
    }

    tracing::debug!(?src_path, "reading image");
    let mut image = ImageReader::open(&src_path)
        .with_context(|| format!("failed to read image at {src_path:?}"))?
        .decode()
        .with_context(|| format!("failed to decode image at {src_path:?}"))?;

    let (src_width, src_height) = (image.width(), image.height());

    let scale = match (spec.width, spec.height) {
        (Some(width), Some(height)) => {
            (width as f64 / src_width as f64).min(height as f64 / src_height as f64)
        }
        (Some(width), None) => width as f64 / src_width as f64,
        (None, Some(height)) => height as f64 / src_height as f64,
        (None, None) => 1.0,
    }
    .min(1.0);

    if scale < 1.0 {
        let target_width = ((src_width as f64 * scale).round() as u32).max(1);
        let target_height = ((src_height as f64 * scale).round() as u32).max(1);

        tracing::debug!(?src_path, ?target_width, ?target_height, "resizing image");
        image = image.resize(
            target_width,
            target_height,
            image::imageops::FilterType::Lanczos3,
        );
    }

    {
        let encoder = webp::Encoder::from_image(&image)
            .map_err(|err| anyhow::anyhow!("failed to create WebP encoder: {err}"))?;

        tracing::debug!(?output_path, "writing image");

        let webp = encoder.encode(spec.quality.unwrap_or(90) as f32);
        std::fs::write(&output_path, &*webp)
            .with_context(|| format!("failed to write image at {output_path:?}"))?;
    }

    Ok(output_url)
}
