use yew::{function_component, html, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct PageProps {
    pub slug: String,
}

#[function_component(Page)]
pub fn page(props: &PageProps) -> Html {
    html! { <h1>{format!("Blog post '{}'", props.slug)}</h1> }
}
