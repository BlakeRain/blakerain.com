use yew::{function_component, html, Html};

use crate::{
    components::{content::PostContent, seo::WebPageSeo, title::Title},
    model::{pages::DocId, ProvideDoc, ProvideTags},
    pages::Route,
};

#[function_component(Page)]
pub fn page() -> Html {
    let details = crate::model::pages::details(DocId::About);

    html! {
        <ProvideTags>
            <Title title={details.summary.title.clone()} />
            <WebPageSeo
                route={Route::About}
                title={details.summary.title.clone()}
                excerpt={details.summary.excerpt.clone()}
                index={true}
                follow={true} />
            <ProvideDoc dir={"pages"} slug={DocId::About.to_string()}>
                <PostContent<DocId> details={details.clone()}  />
            </ProvideDoc>
        </ProvideTags>
    }
}
