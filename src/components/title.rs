use yew::{function_component, html, Html, Properties};

use crate::components::head::Head;

#[derive(Properties, PartialEq)]
pub struct TitleProps {
    pub title: String,
}

#[function_component(Title)]
pub fn title(props: &TitleProps) -> Html {
    html! {
        <Head>
            <title>{props.title.clone()}</title>
        </Head>
    }
}
