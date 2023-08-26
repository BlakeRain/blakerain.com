use yew::{function_component, html, Html, Properties};

use crate::{
    components::{content::PostContent, layout::goto_top::GotoTop},
    model::ProvideTags,
};

#[derive(Properties, PartialEq)]
pub struct PageProps {
    pub slug: String,
}

#[function_component(Page)]
pub fn page(props: &PageProps) -> Html {
    let Some((details, content)) = crate::model::blog::render(&props.slug) else {
        log::error!("Could not find blog post with slug '{}'", &props.slug);
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
            <PostContent details={details} content={content} />
            <GotoTop />
        </ProvideTags>
    }
}
