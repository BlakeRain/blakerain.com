use yew::{function_component, html, Html};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <div class="container">
            <h1>{"Tags"}</h1>
        </div>
    }
}
