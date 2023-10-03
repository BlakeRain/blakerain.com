use yew::{function_component, html, use_effect_with, use_state, Callback, Html, Properties};
use yew_hooks::use_clipboard;
use yew_icons::{Icon, IconId};

#[derive(Properties, PartialEq)]
pub struct CopyToClipboardProps {
    pub value: String,
    pub format: Option<String>,
}

#[function_component(CopyToClipboard)]
pub fn copy_to_clipboard(props: &CopyToClipboardProps) -> Html {
    let copied = use_state(|| false);
    let clipboard = use_clipboard();

    let onclick = {
        let value = props.value.clone();
        let format = props.format.clone();
        let copied = copied.clone();

        Callback::from(move |_| {
            clipboard.write(value.clone().into_bytes(), format.clone());
            copied.set(true);
        })
    };

    {
        let copied = copied.clone();
        use_effect_with(props.value.clone(), move |_| {
            copied.set(false);
        });
    }

    html! {
        <button type="button" title="Copy to clipboard" {onclick}>
            <Icon
                icon_id={
                    if *copied {
                        IconId::LucideClipboardCheck
                    } else {
                        IconId::LucideClipboardCopy
                    }
                }
                width={"1em".to_string()}
                height={"1em".to_string()} />
        </button>
    }
}
