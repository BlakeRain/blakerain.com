use include_dir::{include_dir, Dir, File};
use std::collections::HashMap;
use yew::{function_component, html, Children, ContextProvider, Html, Properties};

use super::{frontmatter::parse_front_matter, PostInfo, Tag};

pub type TagsContext = HashMap<String, Tag>;
pub type PostsContext = Vec<PostInfo>;

#[derive(Properties, PartialEq)]
pub struct ProvideTagsProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ProvideTags)]
pub fn provide_tags(props: &ProvideTagsProps) -> Html {
    let tags = get_tags();

    html! {
        <ContextProvider<TagsContext> context={tags}>
            {props.children.clone()}
        </ContextProvider<TagsContext>>
    }
}

pub fn get_tags() -> TagsContext {
    let file = CONTENT_DIR.get_file("tags.yaml").expect("tags.yaml");
    match serde_yaml::from_slice::<Vec<Tag>>(file.contents()) {
        Ok(tags) => tags
            .into_iter()
            .map(|tag| (tag.slug.clone(), tag))
            .collect::<TagsContext>(),
        Err(err) => {
            panic!("Failed to parse tags.yaml: {err}");
        }
    }
}

#[derive(Properties, PartialEq)]
pub struct ProvidePostsProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ProvidePosts)]
pub fn provide_posts(props: &ProvidePostsProps) -> Html {
    let posts = get_posts();

    html! {
        <ContextProvider<PostsContext> context={posts}>
            {props.children.clone()}
        </ContextProvider<PostsContext>>
    }
}

pub fn get_posts() -> PostsContext {
    let files = CONTENT_DIR.get_dir("posts").expect("posts dir").files();
    let mut posts = files.filter_map(load_post_info).collect::<Vec<_>>();
    posts.sort_by(|a, b| b.doc_info.published.cmp(&a.doc_info.published));
    posts
}

fn load_post_info(file: &File) -> Option<PostInfo> {
    let (Some(front_matter), matter) = parse_front_matter(file.contents()) else {
        return None;
    };

    let slug = file
        .path()
        .file_stem()
        .expect("filename")
        .to_str()
        .expect("valid file name")
        .to_string();

    let reading_time = words_count::count(&matter.content).words / 200;

    Some(PostInfo::from_front_matter(
        slug,
        Some(reading_time),
        matter.excerpt,
        front_matter,
    ))
}

static CONTENT_DIR: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/content");
