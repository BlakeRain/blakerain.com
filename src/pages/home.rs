use yew::{function_component, html, Html};

use crate::{
    components::blog::post_card_list::PostCardList,
    model::{ProvideBlogDetails, ProvideTags},
};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <ProvideTags>
            <ProvideBlogDetails>
                <PostCardList />
            </ProvideBlogDetails>
        </ProvideTags>
    }
}
