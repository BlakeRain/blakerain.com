use gray_matter::{engine::YAML, Matter, ParsedEntity};
use model::frontmatter::FrontMatter;

pub fn parse_front_matter(
    content: &[u8],
) -> Result<(Option<FrontMatter>, ParsedEntity), serde_json::error::Error> {
    let content = unsafe { std::str::from_utf8_unchecked(content) };
    let matter = Matter::<YAML>::new().parse(content);

    let info = if let Some(data) = &matter.data {
        Some(data.deserialize()?)
    } else {
        None
    };

    Ok((info, matter))
}
