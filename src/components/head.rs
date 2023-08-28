use web_sys::HtmlHeadElement;
use yew::{create_portal, function_component, html, use_state, Children, Html, Properties};
use yew_hooks::use_effect_once;

#[derive(Properties, PartialEq)]
pub struct HeadProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Head)]
pub fn head(props: &HeadProps) -> Html {
    let head = use_state(|| None::<HtmlHeadElement>);

    {
        let head = head.clone();
        use_effect_once(move || {
            let head_el = gloo::utils::head();
            head.set(Some(head_el));
            || ()
        })
    }

    if let Some(head) = &*head {
        create_portal(html! { <>{props.children.clone()}</> }, head.clone().into())
    } else {
        html! {}
    }
}
