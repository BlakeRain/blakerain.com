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
    let Some((details, content)) = render(DocId::About) else {
        panic!("Could not find about page");
    };

    html! {
        <ProvideTags>
            <Title title={details.summary.title.clone()} />
            <PostContent<DocId> details={details.clone()} content={content} />
        </ProvideTags>
    }
}
