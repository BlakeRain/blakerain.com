#![allow(non_camel_case_types)]
use yew::{function_component, html, Html, Properties};

use crate::{
    components::{content::PostContent, layout::goto_top::GotoTop, seo::BlogPostSeo, title::Title},
    model::{
        blog::{render, DocId},
        ProvideTags,
    },
    pages::Route,
};

#[derive(Properties, PartialEq)]
pub struct PageProps {
    pub doc_id: DocId,
}

#[function_component(Page)]
pub fn page(props: &PageProps) -> Html {
    let Some((details, content)) = render(props.doc_id) else {
        log::error!("Could not find blog post with ID '{}'", props.doc_id);
        return html! {
            <div class="container mx-auto my-12 px-16">
                <h1 class="text-5xl font-bold text-center text-white">
                    { "Page not found" }
                </h1>
            </div>
        };
    };

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
            <PostContent<DocId> details={details} content={content} />
            <GotoTop />
        </ProvideTags>
    }
}
