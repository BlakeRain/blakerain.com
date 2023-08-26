use serde::Deserialize;
use time::OffsetDateTime;

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
    pub excerpt: Option<String>,
}
