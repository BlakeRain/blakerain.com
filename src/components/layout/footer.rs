use time::OffsetDateTime;
use yew::{function_component, html, Html, Properties};
use yew_router::prelude::Link;

use crate::pages::Route;

#[derive(Properties, PartialEq)]
pub struct FooterProps {}

#[function_component(Footer)]
pub fn footer(_: &FooterProps) -> Html {
    let year = OffsetDateTime::now_utc().year();

    html! {
        <footer class="bg-primary text-neutral-400 text-sm mt-4 min-h-[10rem]">
            <div class="container mx-auto flex flex-col gap-4 md:gap-0 md:flex-row md:justify-between px-4 sm:px-0 py-6">
                <div>
                    {format!("Blake Rain © {year}")}
                    <SizeIndicator />
                </div>
                <div class="flex flex-col gap-4 md:gap-1 md:items-end">
                    <div class="flex flex-col md:flex-row gap-4 md:gap-3">
                        <Link<Route> classes="hover:text-neutral-50" to={Route::Blog}>
                            {"Latest Posts"}
                        </Link<Route>>
                        <Link<Route> classes="hover:text-neutral-50" to={Route::Disclaimer}>
                            {"Disclaimer"}
                        </Link<Route>>
                        <a href="https://github.com/BlakeRain"
                            class="hover:text-neutral-50"
                            title="GitHub"
                            target="_blank"
                            rel="noreferrer">
                            {"GitHub"}
                        </a>
                        <a href="https://mastodonapp.uk/@BlakeRain"
                            class="hover:text-neutral-50"
                            title="@BlakeRain@mastodonapp.uk"
                            target="_blank"
                            rel="noreferrer">
                            {"Mastodon"}
                        </a>
                    </div>
                    <div>
                        {"Powered by "}
                        <a href="https://yew.rs"
                           class="hover:text-neutral-50"
                           title="Yew Web Framework"
                           target="_blank"
                           rel="noreferrer">
                           {"Yew"}
                        </a>
                        {", "}
                        <a href="https://www.rust-lang.org/"
                           class="hover:text-neutral-50"
                           title="Rust Programming Language"
                           target="_blank"
                           rel="noreferrer">
                           {"Rust"}
                        </a>
                        {", and "}
                        <a href="https://webassembly.org/"
                           class="hover:text-neutral-50"
                           title="WebAssembly"
                           target="_blank"
                           rel="noreferrer">
                           {"WebAssembly"}
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    }
}

#[function_component(SizeIndicator)]
fn size_indicator() -> Html {
    #[cfg(debug_assertions)]
    html! {
        <div class="flex flex-row gap-2">
            <div class="opacity-50 sm:opacity-100">{"sm"}</div>
            <div class="opacity-50 md:opacity-100">{"md"}</div>
            <div class="opacity-50 lg:opacity-100">{"lg"}</div>
            <div class="opacity-50 xl:opacity-100">{"xl"}</div>
            <div class="opacity-50 2xl:opacity-100">{"2xl"}</div>
        </div>
    }

    #[cfg(not(debug_assertions))]
    html! {}
}
