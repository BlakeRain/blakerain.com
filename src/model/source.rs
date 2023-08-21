use std::{collections::HashMap, sync::Arc};

use async_trait::async_trait;
use thiserror::Error;
use yew::{function_component, html, Children, ContextProvider, Html, Properties};

use super::{PostInfo, Tag};

#[cfg(feature = "hydration")]
mod web;

#[cfg(not(feature = "hydration"))]
mod fs;

#[derive(Debug, Clone, Error)]
pub enum SourceError {
    #[error("Invalid front matter: {0}")]
    InvalidFrontMatter(String),
    #[error("Invalid tags format")]
    InvalidTags,
}

#[async_trait]
pub trait ModelSource: Send + Sync {
    async fn get_posts(&self) -> Result<Vec<PostInfo>, SourceError>;
    async fn get_tags(&self) -> Result<HashMap<String, Tag>, SourceError>;
}

pub fn get_source() -> Box<dyn ModelSource> {
    // If we're compiled to use hydration, we want to use the web source.
    #[cfg(feature = "hydration")]
    return Box::new(self::web::Source::new());

    // If we're NOT compiled to use hydration, we want to use the file-system source.
    #[cfg(not(feature = "hydration"))]
    return Box::new(fs::Source::new());
}

pub struct ModelSourceWrapper {
    inner: Arc<Box<dyn ModelSource>>,
}

impl Clone for ModelSourceWrapper {
    fn clone(&self) -> Self {
        Self {
            inner: Arc::clone(&self.inner),
        }
    }
}

impl PartialEq for ModelSourceWrapper {
    fn eq(&self, _: &Self) -> bool {
        true
    }
}

#[async_trait]
impl ModelSource for ModelSourceWrapper {
    async fn get_posts(&self) -> Result<Vec<PostInfo>, SourceError> {
        self.inner.get_posts().await
    }

    async fn get_tags(&self) -> Result<HashMap<String, Tag>, SourceError> {
        self.inner.get_tags().await
    }
}

#[derive(Properties, PartialEq)]
pub struct ModelProviderProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ModelProvider)]
pub fn model_provider(props: &ModelProviderProps) -> Html {
    let source = get_source();
    let source = ModelSourceWrapper {
        inner: Arc::new(source),
    };

    html! {
        <ContextProvider<ModelSourceWrapper> context={source}>
            {props.children.clone()}
        </ContextProvider<ModelSourceWrapper>>
    }
}
