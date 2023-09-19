use yew::{function_component, html, Html};
use yew_router::prelude::Link;

use crate::{
    components::{blog::post_card_list::PostCardList, seo::WebPageSeo, title::Title},
    model::{ProvideBlogDetails, ProvideTags},
    pages::Route,
};

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <>
            <Title title={"Blake Rain"} />
            <WebPageSeo
                route={Route::Home}
                title={"Blake Rain"}
                excerpt={Some("Blake Rain's Webpage")}
                index={true}
                follow={true} />
            <div class="py-10 xl:py-20 bg-primary text-neutral-200">
                <div class="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 px-2 xl:px-20 2xl:px-40">
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <img
                            src="/media/white-background.png"
                            class="block object-cover w-40 h-40 xl:w-60 xl:h-60 rounded-full border-4 border-neutral-300" />
                        <div class="flex flex-col gap-2">
                            <h1 class="text-5xl">{"Blake Rain"}</h1>
                            <h2 class="text-3xl text-neutral-400">{"Software Engineer"}</h2>
                        </div>
                    </div>
                    <div class="flex flex-col gap-4">
                      <p class="text-xl">
                          {"Hello! I'm Blake Rain, a UK-based software engineer with a passion for "}
                          {"Rust, C++, and Haskell, though you'll often find me dabbling in Python "}
                          {"and JavaScript. I'm a seasoned user of neovim and a Linux and Unix "}
                          {"enthusiast."}
                      </p>
                      <p class="text-xl">
                          {"As the current Technical Director at "}
                          <a href="https://eclipse-pci.com" class="text-neutral-100 hover:underline">{"Neo Technologies"}</a>
                          {" I work to bring our compliance solutions to life."}
                      </p>
                      <p>
                        <Link<Route> to={Route::About} classes="text-neutral-400 hover:text-neutral-300 hover:underline">
                            {"Read More"}
                        </Link<Route>>
                      </p>
                    </div>
                </div>
            </div>
            <ProvideTags>
                <ProvideBlogDetails>
                    <PostCardList />
                </ProvideBlogDetails>
            </ProvideTags>
        </>
    }
}
