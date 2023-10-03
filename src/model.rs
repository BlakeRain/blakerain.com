use std::{collections::HashMap, rc::Rc};

use gloo::net::http::Request;
use model::{
    document::{decode_nodes, Details, RenderNode},
    tag::Tag,
};
use yew::{
    function_component, html, use_memo, use_state, Children, ContextProvider, Html, Properties,
};
use yew_hooks::{use_async_with_options, UseAsyncOptions};

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

#[derive(Properties, PartialEq)]
pub struct ProvideDocProps {
    pub dir: &'static str,
    pub slug: String,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ProvideDoc)]
pub fn provide_doc(
    ProvideDocProps {
        dir,
        slug,
        children,
    }: &ProvideDocProps,
) -> Html {
    let state = use_state(Vec::new);

    {
        let state = state.clone();
        let dir = *dir;
        let slug = slug.clone();
        use_async_with_options::<_, (), &'static str>(
            async move {
                let data = Request::get(&format!("/content/{dir}/{slug}.bin"))
                    .send()
                    .await
                    .map_err(|err| {
                        log::error!("Failed to fetch document '{slug}' in '{dir}': {err}");
                        "Failed to fetch document"
                    })?
                    .binary()
                    .await
                    .map_err(|err| {
                        log::error!("Failed to fetch document '{slug}' in '{dir}': {err}");
                        "Failed to fetch document"
                    })?;

                state.set(decode_nodes(&data));
                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        );
    }

    html! {
        <ContextProvider<Vec<RenderNode>> context={(*state).clone()}>
            {children.clone()}
        </ContextProvider<Vec<RenderNode>>>
    }
}
