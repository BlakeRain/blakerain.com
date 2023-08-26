use serde::Deserialize;

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct Tag {
    /// The slug of the tag
    pub slug: String,
    /// The display name of the tag
    pub name: String,
    /// Whether the tag is visible or not
    pub visibility: TagVisibility,
    /// A description of the tag
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize)]
pub enum TagVisibility {
    #[serde(rename = "public")]
    Public,
    #[serde(rename = "private")]
    Private,
}
