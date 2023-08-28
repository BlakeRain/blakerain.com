use yew::{classes, function_component, html, use_state_eq, AttrValue, Callback, Html, Properties};
use yew_icons::{Icon, IconId};
use yew_router::prelude::Link;

use crate::pages::Route;

fn navigation_link(target: Route, title: AttrValue) -> Html {
    html! {
        <Link<Route>
            classes={classes!(
                "px-4", "py-6", "transition-colors",
                "hover:bg-primary-dark", "hover:text-neutral-50"
            )}
            to={target}>
            {title}
        </Link<Route>>
    }
}

#[derive(Properties, PartialEq)]
pub struct NavigationProps {}

#[function_component(Navigation)]
pub fn navigation(_: &NavigationProps) -> Html {
    let open = use_state_eq(|| false);

    let on_open_click = {
        let open = open.clone();
        Callback::from(move |_| {
            open.set(!*open);
        })
    };

    html! {
        <nav class="bg-primary shadow-md text-neutral-200">
            <div class="container mx-auto flex flex-col md:flex-row px-4 sm:px-0">
                <div class="flex flex-row justify-between items-center my-4 md:my-0">
                    <Link<Route> classes="block mr-4" to={Route::Home}>
                        <img class="block"
                            src="/media/logo-text.png"
                            width="154"
                            height="28"
                            alt="Blake Rain" />
                    </Link<Route>>
                    <button type="button" class="md:hidden" onclick={on_open_click}>
                        <Icon icon_id={IconId::LucideMenu} />
                        <span class="sr-only">{"Toggle Menu"}</span>
                    </button>
                </div>
                <div class={classes!("md:flex", "flex-col", "md:flex-row",
                                     if *open { "flex" } else { "hidden" })}>
                    {navigation_link(Route::Blog, "Blog".into())}
                    {navigation_link(Route::About, "About".into())}
                </div>
                <div class={classes!("hidden", "md:flex", "flex-row",
                                     "items-center", "gap-2", "ml-auto")}>
                    <a href="https://github.com/BlakeRain"
                       class="text-neutral-200/75 hover:text-neutral-50"
                       title="GitHub"
                       target="_blank"
                       rel="noreferrer">
                        <Icon icon_id={IconId::BootstrapGithub} height={"1.1em"} />
                    </a>
                    <a href="https://mastodonapp.uk/@BlakeRain"
                       class="text-neutral-200/75 hover:text-neutral-50"
                       title="@BlakeRain@mastodonapp.uk"
                       target="_blank"
                       rel="me noreferrer">
                        <Icon icon_id={IconId::BootstrapMastodon} height={"1.1em"} />
                    </a>
                    <a href="/feeds/feed.xml"
                       class="text-neutral-200/75 hover:text-neutral-50"
                       title="RSS Feed">
                        <Icon icon_id={IconId::LucideRss} height={"1.1em"} />
                    </a>
                </div>
            </div>
        </nav>
    }
}
