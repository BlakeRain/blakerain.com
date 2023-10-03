use std::{collections::HashMap, rc::Rc};

use model::{document::Details, tag::Tag};
use yew::{function_component, html, use_memo, Children, ContextProvider, Html, Properties};

macros::tags!("content/tags.yaml");

pub mod blog;
pub mod currency;
pub mod pages;

pub mod trading {
    pub mod account;
    pub mod position;
}

#[derive(Properties, PartialEq)]
pub struct ProvideTagsProps {
    #[prop_or_default]
    pub children: Children,
}

pub type TagsContext = Rc<HashMap<String, Tag>>;

#[function_component(ProvideTags)]
pub fn provide_tags(props: &ProvideTagsProps) -> Html {
    let tags = use_memo(0, |_| tags());

    html! {
        <ContextProvider<TagsContext> context={tags}>
            {props.children.clone()}
        </ContextProvider<TagsContext>>
    }
}

#[derive(Properties, PartialEq)]
pub struct ProvideBlogDetailsProps {
    #[prop_or_default]
    pub children: Children,
}

pub type BlogDetailsContext = Rc<Vec<Details<blog::DocId>>>;

#[function_component(ProvideBlogDetails)]
pub fn provide_blog_details(props: &ProvideBlogDetailsProps) -> Html {
    let details = use_memo(0, |_| blog::documents());

    html! {
        <ContextProvider<BlogDetailsContext> context={details}>
            {props.children.clone()}
        </ContextProvider<BlogDetailsContext>>
    }
}
