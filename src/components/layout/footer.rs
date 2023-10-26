use yew::{function_component, html, Html, Properties};
use yew_router::prelude::Link;

use crate::{pages::Route, BUILD_TIME};

#[derive(Properties, PartialEq)]
pub struct FooterProps {}

#[function_component(Footer)]
pub fn footer(_: &FooterProps) -> Html {
    let year = BUILD_TIME.year();

    html! {
        <footer class="print:hidden bg-primary text-neutral-400 text-sm mt-4 min-h-[10rem]">
            <div class="container mx-auto flex flex-col gap-4 md:gap-0 md:flex-row md:justify-between px-4 sm:px-0 py-6">
                <div class="flex flex-col gap-4 lg:gap-0">
                    <div>{format!("Copyright © {year} Blake Rain")}</div>
                    <div>
                        {format!("Built from ")}
                        <a href={format!("https://git.blakerain.com/BlakeRain/blakerain.com/src/tag/v{}", env!("CARGO_PKG_VERSION"))}
                           class="hover:text-neutral-50"
                           title="Git repository"
                           target="_blank"
                           rel="noreferrer">
                           {format!("v{}", env!("CARGO_PKG_VERSION"))}
                        </a>
                        {format!(" on {}", BUILD_TIME.date())}
                    </div>
                </div>
                <div class="flex flex-col gap-4 lg:gap-0 lg:items-end">
                    <div class="flex flex-col md:items-end lg:items-start lg:flex-row gap-4 lg:gap-3">
                        <Link<Route> classes="hover:text-neutral-50" to={Route::Blog}>
                            {"Latest Posts"}
                        </Link<Route>>
                        <Link<Route> classes="hover:text-neutral-50" to={Route::Disclaimer}>
                            {"Disclaimer"}
                        </Link<Route>>
                        <Link<Route> classes="hover:text-neutral-50" to={Route::PositionSize}>
                            {"Position Size Calculator"}
                        </Link<Route>>
                    </div>
                    <div class="flex flex-col md:items-end lg:items-start lg:flex-row gap-4 lg:gap-3">
                        <a href="https:/git.blakerain.com/BlakeRain"
                            class="hover:text-neutral-50"
                            title="My gitea"
                            target="_blank"
                            rel="noreferrer">
                            {"Gitea"}
                        </a>
                        <a href="https://github.com/BlakeRain"
                            class="hover:text-neutral-50"
                            title="My GitHub profile"
                            target="_blank"
                            rel="noreferrer">
                            {"GitHub Profile"}
                        </a>
                        <a href="https://mastodonapp.uk/@BlakeRain"
                            class="hover:text-neutral-50"
                            title="@BlakeRain@mastodonapp.uk"
                            target="_blank"
                            rel="noreferrer">
                            {"Mastodon"}
                        </a>
                        <a href="https://static.blakerain.com/"
                            class="hover:text-neutral-50"
                            title="Service status"
                            target="_blank"
                            rel="noreferrer">
                            {"Status"}
                        </a>
                    </div>
                    <SizeIndicator />
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
