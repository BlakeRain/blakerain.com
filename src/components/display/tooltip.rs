use yew::{classes, function_component, html, use_state, Callback, Children, Html, Properties};
use yew_icons::{Icon, IconId};

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum TooltipPosition {
    Top,
    Left,
    Bottom,
    Right,
}

impl Default for TooltipPosition {
    fn default() -> Self {
        Self::Top
    }
}

#[derive(Properties, PartialEq)]
pub struct TooltipProps {
    #[prop_or_default]
    pub position: TooltipPosition,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Tooltip)]
pub fn tooltip(props: &TooltipProps) -> Html {
    let open = use_state(|| false);

    let onmouseover = {
        let open = open.clone();
        Callback::from(move |_| {
            open.set(true);
        })
    };

    let onmouseout = {
        let open = open.clone();
        Callback::from(move |_| {
            open.set(false);
        })
    };

    let popup = if *open {
        html! {
            <div class={classes!(
                "tooltip",
                match props.position {
                    TooltipPosition::Top => "top",
                    TooltipPosition::Left => "left",
                    TooltipPosition::Right => "right",
                    TooltipPosition::Bottom => "bottom"
                }
            )}>
                <div class="relative">
                    {props.children.clone()}
                </div>
            </div>
        }
    } else {
        html! {}
    };

    html! {
        <div class="relative inline-block cursor-pointer mx-2" {onmouseover} {onmouseout}>
            <Icon
                icon_id={IconId::HeroiconsSolidQuestionMarkCircle}
                width={"1em".to_string()}
                height={"1em".to_string()} />
            {popup}
        </div>
    }
}
