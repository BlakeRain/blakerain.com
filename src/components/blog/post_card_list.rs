use yew::{function_component, html, use_context, Html};

use crate::{components::blog::post_card::PostCard, model::BlogDetailsContext};

#[function_component(PostCardList)]
pub fn post_card_list() -> Html {
    let posts = use_context::<BlogDetailsContext>().expect("BlogDetailsContext to be provided");

    html! {
        <div class="container mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-10 lg:gap-y-20 my-10 px-2 sm:px-0">
                {for posts.iter().enumerate().map(|(index, post)| {
                    html! {
                        <PostCard post={post.clone()} first={index == 0} />
                    }
                })}
            </div>
        </div>
    }
}
