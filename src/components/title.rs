use yew::{function_component, html, use_effect_with_deps, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct TitleProps {
    pub title: String,
}

#[function_component(Title)]
pub fn title(props: &TitleProps) -> Html {
    let title = props.title.clone();

    use_effect_with_deps(
        move |_| {
            let head_el = gloo::utils::head();
            let title_el = head_el
                .query_selector("title")
                .expect("query_selector")
                .expect("title");

            title_el.set_text_content(Some(&title));
        },
        props.title.clone(),
    );

    html! {}
}
