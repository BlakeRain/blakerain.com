use yew::{function_component, html, Html};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <div class="container">
            <h1>{"404"}</h1>
            <p>{"The page you are looking for does not exist."}</p>
        </div>
    }
}
