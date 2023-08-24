use std::collections::HashMap;
use thiserror::Error;
use yew::{function_component, html, use_state, Children, ContextProvider, Html, Properties};
use yew_hooks::{use_async_with_options, UseAsyncOptions};

use crate::model::source::{PostsContext, TagsContext};

#[derive(Debug, Error, Clone, PartialEq)]
pub enum ApiError {
    #[error("Unable to complete request")]
    RequestError,
    #[error("Unable to deserialize response")]
    DeserializeError,
}

#[derive(Properties, PartialEq)]
pub struct ProvideTagsProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ProvideTags)]
pub fn provide_tags(props: &ProvideTagsProps) -> Html {
    let tags = use_state(HashMap::new);

    {
        let tags = tags.clone();
        use_async_with_options::<_, (), ApiError>(
            async move {
                let res = reqwest::get("/tags.json")
                    .await
                    .map_err(|err| {
                        log::error!("Failed to get '/tags.json': {err:?}");
                        ApiError::RequestError
                    })?
                    .json()
                    .await
                    .map_err(|err| {
                        log::error!("Failed to deserialize '/tags.json': {err:?}");
                        ApiError::DeserializeError
                    })?;
                tags.set(res);
                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        );
    }

    html! {
        <ContextProvider<TagsContext> context={(*tags).clone()}>
            {props.children.clone()}
        </ContextProvider<TagsContext>>
    }
}

#[derive(Properties, PartialEq)]
pub struct ProvidePostsProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ProvidePosts)]
pub fn provide_posts(props: &ProvidePostsProps) -> Html {
    let posts = use_state(Vec::new);

    {
        let posts = posts.clone();
        use_async_with_options::<_, (), ApiError>(
            async move {
                let res = reqwest::get("/posts.json")
                    .await
                    .map_err(|err| {
                        log::error!("Failed to get '/posts.json': {err:?}");
                        ApiError::RequestError
                    })?
                    .json()
                    .await
                    .map_err(|err| {
                        log::error!("Failed to deserialize '/posts.json': {err:?}");
                        ApiError::DeserializeError
                    })?;
                posts.set(res);
                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        );
    }

    html! {
        <ContextProvider<PostsContext> context={(*posts).clone()}>
            {props.children.clone()}
        </ContextProvider<PostsContext>>
    }
}
