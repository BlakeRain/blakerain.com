use yew::{function_component, html, Html};

use crate::{
    components::blog::post_card_list::PostCardList,
    model::source::{ProvidePosts, ProvideTags},
};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <ProvideTags>
            <ProvidePosts>
                <PostCardList />
            </ProvidePosts>
        </ProvideTags>
    }
}
