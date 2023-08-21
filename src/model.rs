pub mod frontmatter;
pub mod source;
pub mod tags;

use serde::Deserialize;
use time::OffsetDateTime;

use self::frontmatter::FrontMatter;

#[derive(Debug, Clone, PartialEq)]
pub struct DocInfo {
    /// The slug used to form the URL for this document.
    pub slug: String,
    /// The rendered title for the document.
    pub title: String,
    /// Any given excerpt.
    pub excerpt: Option<String>,
    /// The date on which this document was published.
    pub published: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct PostInfo {
    /// Document information.
    pub doc_info: DocInfo,
    /// Tags attached to this post.
    pub tags: Vec<String>,
    /// The read time (in seconds).
    pub reading_time: Option<usize>,
    /// The URL to the cover image.
    pub cover_image: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Post {
    /// Information about the post
    pub info: PostInfo,
    /// The main content
    pub content: String,
}

impl PostInfo {
    pub fn from_front_matter(
        slug: String,
        reading_time: Option<usize>,
        excerpt: Option<String>,
        FrontMatter {
            title,
            tags,
            published,
            cover,
        }: FrontMatter,
    ) -> Self {
        PostInfo {
            doc_info: DocInfo {
                slug,
                title,
                excerpt,
                published,
            },

            tags,
            reading_time,
            cover_image: cover,
        }
    }
}

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
