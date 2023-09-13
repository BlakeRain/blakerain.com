use web_sys::{window, ScrollBehavior, ScrollToOptions};
use yew::{function_component, html, use_effect_with_deps, Children, Html, Properties};
use yew_router::prelude::use_location;

use crate::components::analytics::Analytics;

mod footer;
pub mod goto_top;
pub mod intersperse;
mod navigation;

#[derive(Properties, PartialEq)]
pub struct LayoutProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Layout)]
pub fn layout(props: &LayoutProps) -> Html {
    let location = use_location();

    use_effect_with_deps(
        |_| {
            let mut opts = ScrollToOptions::new();
            opts.top(0f64);
            opts.behavior(ScrollBehavior::Instant);
            window()
                .expect("window")
                .scroll_to_with_scroll_to_options(&opts);
        },
        location,
    );

    html! {
        <div class="flex flex-col">
            <navigation::Navigation />
            {props.children.clone()}
            <footer::Footer />
            <Analytics />
        </div>
    }
}
