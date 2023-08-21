use yew::{function_component, html, Html, Properties};

use crate::{components::blog::post_card::PostCard, model::PostInfo};

#[derive(Properties, PartialEq)]
pub struct PostCardListProps {
    pub posts: Vec<PostInfo>,
}

#[function_component(PostCardList)]
pub fn post_card_list(props: &PostCardListProps) -> Html {
    html! {
        <div class="grid grid-cols-3 gap-x-10 gap-y-20 my-10">
            {for props.posts.iter().enumerate().map(|(index, post)| {
                html! {
                    <PostCard post={post.clone()} first={index == 0} />
                }
            })}
        </div>
    }
}
