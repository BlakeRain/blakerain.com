use yew::{classes, function_component, html, AttrValue, Callback, Classes, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct ToggleProps {
    #[prop_or_default]
    pub label: AttrValue,
    pub value: bool,
    #[prop_or_default]
    pub classes: Classes,
    #[prop_or_default]
    pub disabled: bool,
    pub onchange: Callback<bool>,
}

#[function_component(Toggle)]
pub fn toggle(props: &ToggleProps) -> Html {
    let onclick = {
        let onchange = props.onchange.clone();
        let value = props.value;
        let disabled = props.disabled;

        Callback::from(move |_| {
            if disabled {
                return;
            }

            onchange.emit(!value);
        })
    };

    html! {
        <div class="flex flex-row items-center gap-2">
            <div class={classes!("toggle",
                                 if props.value { "active" } else { "inactive" },
                                 if props.disabled { "disabled" } else { "" },
                                 props.classes.clone())}
                 {onclick}>
                 <div class="toggle-background" />
                <div class="toggle-inner" />
            </div>
            if !props.label.is_empty() {
                <div>
                    {props.label.clone()}
                </div>
            }
        </div>
    }
}
