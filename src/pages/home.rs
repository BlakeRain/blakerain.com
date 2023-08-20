use yew::{function_component, html, use_state, Callback, Html};
use yew_router::prelude::Link;

use crate::pages::Route;

#[function_component(Page)]
pub fn page() -> Html {
    let count = use_state(|| 0);

    let button_click = {
        let count = count.clone();
        Callback::from(move |_| count.set(*count + 1))
    };

    html! {
        <>
            <h1>{"Home"}</h1>
            <button type="button" onclick={button_click}>{format!("Clicked {} times", *count)}</button>
            <Link<Route> to={Route::About}>{"About"}</Link<Route>>
        </>
    }
}
