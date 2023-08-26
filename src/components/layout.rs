use yew::{function_component, html, Children, Html, Properties};

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
    html! {
        <div class="flex flex-col">
            <navigation::Navigation />
            {props.children.clone()}
            <footer::Footer />
        </div>
    }
}
