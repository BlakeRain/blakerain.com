use serde::{Deserialize, Serialize};
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

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RenderNode {
    Text(RenderText),
    Element(RenderElement),
    Icon(RenderIcon),
}

impl From<RenderText> for RenderNode {
    fn from(value: RenderText) -> Self {
        Self::Text(value)
    }
}

impl From<RenderElement> for RenderNode {
    fn from(value: RenderElement) -> Self {
        Self::Element(value)
    }
}

impl From<RenderIcon> for RenderNode {
    fn from(value: RenderIcon) -> Self {
        Self::Icon(value)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderText {
    pub content: String,
}

impl RenderText {
    pub fn new<S: Into<String>>(content: S) -> Self {
        Self {
            content: content.into(),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Serialize, Deserialize)]
pub enum RenderIcon {
    Bug,
    Flame,
    Info,
    Lightning,
    Link,
    List,
    Note,
    Question,
    Success,
    Todo,
    Warning,
    X,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderElement {
    pub tag: TagName,
    pub attributes: Vec<RenderAttribute>,
    pub children: Vec<RenderNode>,
}

impl RenderElement {
    pub fn new(tag: TagName) -> Self {
        Self {
            tag,
            attributes: Vec::new(),
            children: Vec::new(),
        }
    }

    pub fn add_attribute<A: Into<String>>(&mut self, name: AttributeName, value: A) {
        self.attributes.push(RenderAttribute {
            name,
            value: value.into(),
        })
    }

    pub fn add_child<C: Into<RenderNode>>(&mut self, child: C) {
        self.children.push(child.into());
    }

    pub fn add_children<C: Into<RenderNode>, I: IntoIterator<Item = C>>(&mut self, children: I) {
        let mut children = children.into_iter().map(Into::into).collect::<Vec<_>>();
        self.children.append(&mut children);
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Serialize, Deserialize)]
pub enum TagName {
    A,
    BlockQuote,
    Br,
    Cite,
    Code,
    Div,
    Em,
    FigCaption,
    Figure,
    H1,
    H2,
    H3,
    H4,
    H5,
    H6,
    Hr,
    Img,
    Input,
    Li,
    Ol,
    P,
    Pre,
    S,
    Span,
    Strong,
    Sup,
    TBody,
    THead,
    Table,
    Td,
    Th,
    Tr,
    Ul,
}

impl TagName {
    pub fn as_str(&self) -> &'static str {
        match self {
            TagName::A => "a",
            TagName::BlockQuote => "blockquote",
            TagName::Br => "br",
            TagName::Cite => "cite",
            TagName::Code => "code",
            TagName::Div => "div",
            TagName::Em => "em",
            TagName::FigCaption => "figcaption",
            TagName::Figure => "figure",
            TagName::H1 => "h1",
            TagName::H2 => "h2",
            TagName::H3 => "h3",
            TagName::H4 => "h4",
            TagName::H5 => "h5",
            TagName::H6 => "h6",
            TagName::Hr => "hr",
            TagName::Img => "img",
            TagName::Input => "input",
            TagName::Li => "li",
            TagName::Ol => "ol",
            TagName::P => "p",
            TagName::Pre => "pre",
            TagName::S => "s",
            TagName::Span => "span",
            TagName::Strong => "strong",
            TagName::Sup => "sup",
            TagName::TBody => "tbody",
            TagName::THead => "thead",
            TagName::Table => "table",
            TagName::Td => "td",
            TagName::Th => "th",
            TagName::Tr => "tr",
            TagName::Ul => "ul",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderAttribute {
    pub name: AttributeName,
    pub value: String,
}

#[derive(Debug, Copy, Clone, PartialEq, Serialize, Deserialize)]
pub enum AttributeName {
    Alt,
    Checked,
    Class,
    Decoding,
    Disabled,
    Href,
    Id,
    Loading,
    Src,
    Start,
    Style,
    Title,
    Type,
}

impl AttributeName {
    pub fn as_str(&self) -> &'static str {
        match self {
            AttributeName::Alt => "alt",
            AttributeName::Checked => "checked",
            AttributeName::Class => "class",
            AttributeName::Decoding => "decoding",
            AttributeName::Disabled => "disabled",
            AttributeName::Href => "href",
            AttributeName::Id => "id",
            AttributeName::Loading => "loading",
            AttributeName::Src => "src",
            AttributeName::Start => "start",
            AttributeName::Style => "style",
            AttributeName::Title => "title",
            AttributeName::Type => "type",
        }
    }
}

pub fn encode_nodes(nodes: Vec<RenderNode>) -> Vec<u8> {
    postcard::to_stdvec(&nodes).expect("encoded nodes")
}

pub fn decode_nodes(encoded: &[u8]) -> Vec<RenderNode> {
    postcard::from_bytes(encoded).expect("decoded nodes")
}
