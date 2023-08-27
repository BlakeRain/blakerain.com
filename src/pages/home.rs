use yew::{function_component, html, Html};

use crate::{
    components::{blog::post_card_list::PostCardList, title::Title},
    model::{ProvideBlogDetails, ProvideTags},
};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <ProvideTags>
            <Title title={"Blake Rain"} />
            <ProvideBlogDetails>
                <PostCardList />
            </ProvideBlogDetails>
        </ProvideTags>
    }
}
