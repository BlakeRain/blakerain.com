use yew::{function_component, html, Children, Html, Properties};

mod footer;
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
            <div class="container mx-auto">
                {props.children.clone()}
            </div>
            <footer::Footer />
        </div>
    }
}
