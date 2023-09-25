use yew::{classes, function_component, html, AttrValue, Children, Classes, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct LabelProps {
    pub title: AttrValue,
    #[prop_or_default]
    pub class: Classes,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Label)]
pub fn label(props: &LabelProps) -> Html {
    let class = classes!("flex", "flex-col", "gap-2", props.class.clone());

    html! {
        <div class={class}>
            <label class="text-sm font-medium">
                {props.title.clone()}
            </label>
            {props.children.clone()}
        </div>
    }
}
