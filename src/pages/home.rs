use yew::{function_component, html, use_context, use_state, Html};
use yew_hooks::{use_async_with_options, UseAsyncOptions};

use crate::{
    components::blog::post_card_list::PostCardList,
    model::source::{ModelSource, ModelSourceWrapper, SourceError},
};

#[function_component(Page)]
pub fn page() -> Html {
    let source = use_context::<ModelSourceWrapper>().expect("ModelSource to be provided");
    let posts = use_state(Vec::new);

    {
        let posts = posts.clone();
        use_async_with_options::<_, (), SourceError>(
            async move {
                posts.set(source.get_posts().await?);
                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        );
    }

    html! {
        <>
            <PostCardList posts={(*posts).clone()} />
        </>
    }
}
