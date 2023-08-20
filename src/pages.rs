mod about;
mod blog;
mod blog_post;
mod disclaimer;
mod home;

use yew::{html, Html};
use yew_router::Routable;

#[derive(Debug, Clone, PartialEq, Eq, Routable)]
pub enum Route {
    #[at("/")]
    Home,
    #[at("/about")]
    About,
    #[at("/blog")]
    Blog,
    #[at("/blog/{slug}")]
    BlogPost { slug: String },
    #[at("/disclaimer")]
    Disclaimer,
}

impl Route {
    pub fn switch(self) -> Html {
        match self {
            Self::Home => html! { <home::Page /> },
            Self::About => html! { <about::Page /> },
            Self::Blog => html! { <blog::Page /> },
            Self::BlogPost { slug } => html! { <blog_post::Page slug={slug} /> },
            Self::Disclaimer => html! { <disclaimer::Page /> },
        }
    }
}
