use gray_matter::{engine::YAML, Matter, ParsedEntity};
use serde::Deserialize;
use time::OffsetDateTime;

use super::source::SourceError;

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct FrontMatter {
    pub title: String,
    pub tags: Vec<String>,
    #[serde(
        serialize_with = "time::serde::rfc3339::option::serialize",
        deserialize_with = "time::serde::rfc3339::option::deserialize"
    )]
    pub published: Option<OffsetDateTime>,
    pub cover: Option<String>,
}

pub fn parse_front_matter(
    content: &[u8],
) -> Result<(Option<FrontMatter>, ParsedEntity), SourceError> {
    let content = unsafe { std::str::from_utf8_unchecked(content) };
    let matter = Matter::<YAML>::new().parse(content);

    let info: Option<FrontMatter> = if let Some(data) = &matter.data {
        Some(data.deserialize().map_err(|err| {
            log::error!("Failed to parse front matter: {err:?}");
            SourceError::InvalidFrontMatter(err.to_string())
        })?)
    } else {
        None
    };

    Ok((info, matter))
}
