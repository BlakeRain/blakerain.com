use yew::{function_component, html, Html, Properties};

use crate::{
    components::content::PostContent,
    model::source::{ProvidePost, ProvideTags},
};

#[derive(Properties, PartialEq)]
pub struct PageProps {
    pub slug: String,
}

#[function_component(Page)]
pub fn page(props: &PageProps) -> Html {
    html! {
        <ProvideTags>
            <ProvidePost slug={props.slug.clone()}>
                <PostContent />
            </ProvidePost>
        </ProvideTags>
    }
}
