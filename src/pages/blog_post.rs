#![allow(non_camel_case_types)]
use yew::{function_component, html, Html, Properties};

use crate::{
    components::{content::PostContent, layout::goto_top::GotoTop, seo::BlogPostSeo, title::Title},
    model::{blog::DocId, ProvideDoc, ProvideTags},
    pages::Route,
};

#[derive(Properties, PartialEq)]
pub struct PageProps {
    pub doc_id: DocId,
}

#[function_component(Page)]
pub fn page(props: &PageProps) -> Html {
    let details = crate::model::blog::details(props.doc_id);

    html! {
        <ProvideTags>
            <Title title={details.summary.title.clone()} />
            <BlogPostSeo
                route={Route::BlogPost { doc_id: props.doc_id }}
                image={details.cover_image.clone()}
                title={details.summary.title.clone()}
                excerpt={details.summary.excerpt.clone()}
                published={details.summary.published}
                tags={details.tags.clone()} />
            <ProvideDoc dir={"blog"} slug={props.doc_id.to_string()}>
                <PostContent<DocId> details={details} />
            </ProvideDoc>
            <GotoTop />
        </ProvideTags>
    }
}
