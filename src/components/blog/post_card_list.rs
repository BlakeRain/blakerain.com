use yew::{function_component, html, use_context, Html, Properties};

use crate::{components::blog::post_card::PostCard, model::source::PostsContext};

#[function_component(PostCardList)]
pub fn post_card_list() -> Html {
    let posts = use_context::<PostsContext>().expect("PostsContext to be provided");

    html! {
        <div class="grid grid-cols-3 gap-x-10 gap-y-20 my-10">
            {for posts.iter().enumerate().map(|(index, post)| {
                html! {
                    <PostCard post={post.clone()} first={index == 0} />
                }
            })}
        </div>
    }
}
