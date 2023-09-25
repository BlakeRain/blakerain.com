use yew::{function_component, html, use_state, Children, Html, Properties};
use yew_hooks::use_effect_once;

#[derive(Properties, PartialEq)]
pub struct ClientOnlyProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(ClientOnly)]
pub fn client_only(props: &ClientOnlyProps) -> Html {
    let loaded = use_state(|| false);

    {
        let loaded = loaded.clone();
        use_effect_once(move || {
            loaded.set(true);
            || {}
        })
    }

    if !*loaded {
        html! {}
    } else {
        html! {
            <>{props.children.clone()}</>
        }
    }
}
