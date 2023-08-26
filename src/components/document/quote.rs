use yew::{function_component, html, Children, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct QuoteProps {
    pub author: Option<String>,
    pub url: Option<String>,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Quote)]
pub fn quote(props: &QuoteProps) -> Html {
    let cite = props.author.clone().map(|author| {
        props
            .url
            .clone()
            .map(|url| {
                html! {
                    <cite>
                        <a href={url} target="_blank" rel="noreferrer">{author.clone()}</a>
                    </cite>
                }
            })
            .unwrap_or_else(|| html! { <cite>{author.clone()}</cite> })
    });

    html! {
        <figure class="quote">
            {props.children.clone()}
            {cite}
        </figure>
    }
}
