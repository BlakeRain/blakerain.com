use yew::{function_component, html, Html, Properties};

use crate::components::head::Head;

#[derive(Properties, PartialEq)]
pub struct TitleProps {
    pub title: String,
}

#[function_component(Title)]
pub fn title(props: &TitleProps) -> Html {
    #[cfg(feature = "static")]
    {
        let head = yew::use_context::<crate::app::HeadWriter>().expect("HeadWriter to be provided");
        write!(head, "<title>{}</title>", props.title);
    }

    html! {
        <Head>
            <title>{props.title.clone()}</title>
        </Head>
    }
}
