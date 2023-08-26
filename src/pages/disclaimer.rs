use yew::{function_component, html, Html};

use crate::{components::content::PostContent, model::ProvideTags};

#[function_component(Page)]
pub fn page() -> Html {
    let Some((details, content)) = crate::model::pages::render("disclaimer") else {
        panic!("Could not find 'disclaimer' page");
    };

    html! {
        <ProvideTags>
            <PostContent details={details} content={content} />
        </ProvideTags>
    }
}
