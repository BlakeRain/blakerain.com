use time::OffsetDateTime;

use crate::frontmatter::FrontMatter;

#[derive(Debug, Clone, PartialEq)]
pub struct Summary<S> {
    /// The slug used to form the URL for this document.
    pub slug: S,
    /// The rendered title for the document.
    pub title: String,
    /// Any given excerpt.
    pub excerpt: Option<String>,
    /// The date on which this document was published.
    pub published: Option<OffsetDateTime>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Details<S> {
    /// Document summary.
    pub summary: Summary<S>,
    /// Tags attached to this post.
    pub tags: Vec<String>,
    /// The read time (in seconds).
    pub reading_time: Option<usize>,
    /// The URL to the cover image.
    pub cover_image: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Document<S> {
    /// Document details
    pub details: Details<S>,
    /// The main content
    pub content: String,
}

impl<S> Details<S> {
    pub fn from_front_matter(
        slug: S,
        reading_time: Option<usize>,
        FrontMatter {
            title,
            tags,
            published,
            cover,
            excerpt,
        }: FrontMatter,
    ) -> Self {
        Self {
            summary: Summary {
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
