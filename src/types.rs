use std::{fs::Metadata, path::PathBuf};

use anyhow::Context;
use serde::Serialize;
use time::OffsetDateTime;

use crate::render::Outline;

#[derive(Debug, Serialize)]
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

#[derive(Debug, Serialize)]
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
