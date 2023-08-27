use yew::{function_component, html, Html};

use crate::{
    components::{content::PostContent, title::Title},
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
            <Title title={details.summary.title.clone()} />
            <PostContent<DocId> details={details} content={content} />
        </ProvideTags>
    }
}
