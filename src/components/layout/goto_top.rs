use wasm_bindgen::{prelude::Closure, JsCast};
use web_sys::{window, Element, IntersectionObserver, IntersectionObserverEntry, ScrollToOptions};
use yew::{classes, function_component, html, use_effect, use_state_eq, Callback, Html};

#[function_component(GotoTop)]
pub fn goto_top() -> Html {
    let footer_el = use_state_eq(|| None::<Element>);
    let visible = use_state_eq(|| false);
    let footer_visible = use_state_eq(|| false);

    let class = classes!(
        "cursor-pointer",
        "py-4",
        "px-8",
        "border",
        "border-primary-dark",
        "bg-primary-dark",
        "hover:bg-primary",
        "fixed",
        "bottom-8",
        "right-8",
        "transition-all",
        "transition-200",
        if *visible { "opacity-100" } else { "opacity-0" },
    );

    let style = if *footer_visible {
        let height = if let Some(footer) = &*footer_el {
            -footer.get_bounding_client_rect().height()
        } else {
            -10.0
        };

        format!("transform: translateY({}px)", height)
    } else if *visible {
        "transform: translateY(0px)".to_string()
    } else {
        "transform: translateY(100px)".to_string()
    };

    {
        use_effect(move || {
            let observe = {
                Closure::<dyn Fn(Vec<IntersectionObserverEntry>)>::wrap(Box::new(
                    move |entries: Vec<IntersectionObserverEntry>| {
                        for entry in entries {
                            let tag_name = entry.target().tag_name();
                            if tag_name == "NAV" {
                                visible.set(!entry.is_intersecting());
                            } else if tag_name == "FOOTER" {
                                footer_visible.set(entry.is_intersecting());
                            }
                        }
                    },
                ))
            };

            let document = window().expect("window").document().expect("document");
            let header = document
                .query_selector("nav:first-of-type")
                .expect("query_selector");
            let footer = document.query_selector("footer").expect("query_selector");

            let observer = IntersectionObserver::new(observe.as_ref().unchecked_ref()).unwrap();

            if let Some(header) = header {
                observer.observe(&header);
            }

            if let Some(footer) = footer {
                observer.observe(&footer);
                footer_el.set(Some(footer));
            }

            move || {
                observer.disconnect();
                drop(observe);
            }
        });
    }

    let onclick = Callback::from(move |_| {
        let mut opts = ScrollToOptions::new();
        opts.top(0f64);
        window()
            .expect("window")
            .scroll_to_with_scroll_to_options(&opts);
    });

    html! {
        <button {class} {style} type="button" tabindex="-1" {onclick}>{"↑ Goto Top"}</button>
    }
}
