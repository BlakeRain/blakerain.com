use yew::{function_component, html, Html};

use crate::{
    components::{content::PostContent, seo::WebPageSeo, title::Title},
    model::{
        pages::{render, DocId},
        ProvideTags,
    },
    pages::Route,
};

#[function_component(Page)]
pub fn page() -> Html {
    let Some((details, content)) = render(DocId::Disclaimer) else {
        panic!("Could not find disclaimer page");
    };

    html! {
        <ProvideTags>
            <Title title={details.summary.title.clone()} />
            <WebPageSeo
                route={Route::About}
                title={details.summary.title.clone()}
                excerpt={details.summary.excerpt.clone()}
                index={false}
                follow={false} />
            <PostContent<DocId> details={details} content={content} />
        </ProvideTags>
    }
}
