use yew::{function_component, html, Html};

use crate::{
    components::{blog::post_card_list::PostCardList, seo::WebPageSeo, title::Title},
    model::{ProvideBlogDetails, ProvideTags},
    pages::Route,
};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <ProvideTags>
            <Title title={"Blake Rain's Blog"} />
            <WebPageSeo
                route={Route::Blog}
                title={"Blake Rain's Blog"}
                excerpt={Some("Blake Rain's Blog")}
                index={true}
                follow={true} />
            <ProvideBlogDetails>
                <PostCardList />
            </ProvideBlogDetails>
        </ProvideTags>
    }
}
