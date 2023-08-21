use std::collections::HashMap;

use yew::{
    function_component, html, use_context, use_state, Children, ContextProvider, Html, Properties,
};
use yew_hooks::{use_async_with_options, UseAsyncOptions};

use crate::model::source::{ModelSource, SourceError};

use super::{source::ModelSourceWrapper, Tag};

#[derive(Properties, PartialEq)]
pub struct TagsProviderProps {
    #[prop_or_default]
    pub children: Children,
}

#[derive(Clone, Default, PartialEq)]
pub struct TagsContext {
    tags: HashMap<String, Tag>,
}

impl TagsContext {
    fn new(tags: HashMap<String, Tag>) -> Self {
        Self { tags }
    }

    pub fn get_tag<S: AsRef<str>>(&self, slug: S) -> Option<Tag> {
        self.tags.get(slug.as_ref()).cloned()
    }
}

#[function_component(TagsProvider)]
pub fn tags_provider(props: &TagsProviderProps) -> Html {
    let source = use_context::<ModelSourceWrapper>().expect("ModelSource to be provided");
    let tags = use_state(TagsContext::default);

    {
        let tags = tags.clone();
        use_async_with_options::<_, (), SourceError>(
            async move {
                tags.set(TagsContext::new(source.get_tags().await?));
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
