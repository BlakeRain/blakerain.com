use std::collections::HashMap;

use async_trait::async_trait;
use include_dir::{include_dir, Dir, File};

use crate::model::{frontmatter::parse_front_matter, PostInfo, Tag};

use super::{ModelSource, SourceError};

pub struct Source {}

impl Source {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl ModelSource for Source {
    async fn get_posts(&self) -> Result<Vec<PostInfo>, SourceError> {
        let files = get_post_files().map(|file| -> Result<Option<PostInfo>, SourceError> {
            let (Some(front_matter), matter) = parse_front_matter(file.contents())? else {
                    return Ok(None);
                };

            let slug = file
                .path()
                .file_stem()
                .expect("filename")
                .to_str()
                .expect("valid file name")
                .to_string();

            let reading_time = words_count::count(&matter.content).words / 200;

            Ok(Some(PostInfo::from_front_matter(
                slug,
                Some(reading_time),
                matter.excerpt,
                front_matter,
            )))
        });

        let mut posts = Vec::new();
        for file in files {
            let file = file?;
            if let Some(file) = file {
                posts.push(file);
            }
        }

        posts.sort_by(|a, b| b.doc_info.published.cmp(&a.doc_info.published));

        Ok(posts)
    }

    async fn get_tags(&self) -> Result<HashMap<String, Tag>, SourceError> {
        let file = CONTENT_DIR.get_file("tags.yaml").expect("tags.yaml");
        match serde_yaml::from_slice::<Vec<Tag>>(file.contents()) {
            Ok(tags) => Ok(tags
                .into_iter()
                .map(|tag| (tag.slug.clone(), tag))
                .collect()),
            Err(err) => {
                log::error!("Failed to parse tags.yaml: {err}");
                Err(SourceError::InvalidTags)
            }
        }
    }
}

fn get_post_files<'a>() -> impl Iterator<Item = &'a File<'a>> {
    CONTENT_DIR.get_dir("posts").expect("posts dir").files()
}

static CONTENT_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/content");
