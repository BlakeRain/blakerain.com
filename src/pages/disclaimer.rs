use yew::{function_component, html, Html};

use crate::{
    components::content::PostContent,
    model::{
        pages::{render, DocId},
        ProvideTags,
    },
};

#[function_component(Page)]
pub fn page() -> Html {
    let Some((details, content)) = render(DocId::Disclaimer) else {
        panic!("Could not find disclaimer page");
    };

    html! {
        <ProvideTags>
            <PostContent<DocId> details={details} content={content} />
        </ProvideTags>
    }
}
