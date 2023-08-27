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
    let Some((details, content)) = render(DocId::About) else {
        panic!("Could not find about page");
    };

    html! {
        <ProvideTags>
            <PostContent<DocId> details={details.clone()} content={content} />
        </ProvideTags>
    }
}
