use std::{
    fs::Metadata,
    path::{Path, PathBuf},
};

use anyhow::Context;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;

use crate::render::Outline;

#[derive(Debug, Serialize, Deserialize)]
pub struct Page {
    pub path: PathBuf,
    pub base: PathBuf,
    pub name: String,
    pub metadata: PageMetadata,
    pub frontmatter: serde_json::Value,
    pub summary: Option<String>,
    pub summary_text: Option<String>,
    pub toc: Vec<Outline>,
    pub content: String,
    pub word_count: usize,
    pub reading_time: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PageMetadata {
    pub size: u64,
    pub modified: OffsetDateTime,
    pub created: OffsetDateTime,
}

impl TryFrom<Metadata> for PageMetadata {
    type Error = anyhow::Error;

    fn try_from(metadata: Metadata) -> Result<Self, Self::Error> {
        let size = metadata.len();
        let modified =
            OffsetDateTime::from(metadata.modified().context("failed to get modified time")?);
        let created =
            OffsetDateTime::from(metadata.created().context("failed to get created time")?);

        Ok(Self {
            size,
            modified,
            created,
        })
    }
}

impl Page {
    pub fn load<P: AsRef<Path>>(path: P) -> anyhow::Result<Self> {
        let path = path.as_ref();
        let source = std::fs::read_to_string(path).context("failed to read source file")?;
        serde_json::from_str(&source).context("failed to parse frontmatter")
    }

    pub fn load_all<P: AsRef<Path>>(path: P) -> anyhow::Result<Vec<Self>> {
        let path = path.as_ref();

        if !path.is_dir() {
            tracing::error!(?path, "pages path is not a directory");
            anyhow::bail!("path {:?} is not a directory", path);
        }

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

            let page =
                Page::load(path).with_context(|| format!("failed to load page at {path:?}"))?;

            pages.push(page);
        }

        Ok(pages)
    }

    pub fn get_tags(&self) -> Vec<String> {
        let Some(tags) = self.frontmatter.get("tags") else {
            return Vec::new();
        };

        let Some(tags) = tags.as_array() else {
            return Vec::new();
        };

        tags.iter()
            .filter_map(|tag| tag.as_str().map(String::from))
            .collect()
    }

    pub fn get_date(&self) -> Option<String> {
        let Some(date) = self.frontmatter.get("date") else {
            return None;
        };

        let Some(date) = date.as_str() else {
            return None;
        };

        Some(String::from(date))
    }
}
