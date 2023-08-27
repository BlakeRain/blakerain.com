use enum_iterator::Sequence;
use yew::{html, Html};
use yew_router::Routable;

mod about;
mod blog;
mod blog_post;
mod disclaimer;
mod home;
mod not_found;
mod tags;

#[derive(Debug, Clone, PartialEq, Sequence, Routable)]
pub enum Route {
    #[at("/")]
    Home,
    #[at("/about")]
    About,
    #[at("/blog")]
    Blog,
    #[at("/blog/:doc_id")]
    BlogPost { doc_id: crate::model::blog::DocId },
    #[at("/disclaimer")]
    Disclaimer,
    #[at("/tags")]
    Tags,
    #[not_found]
    #[at("/404")]
    NotFound,
}

impl Route {
    pub fn switch(self) -> Html {
        match self {
            Self::Home => html! { <home::Page /> },
            Self::About => html! { <about::Page /> },
            Self::Blog => html! { <blog::Page /> },
            Self::BlogPost { doc_id } => html! { <blog_post::Page {doc_id} /> },
            Self::Disclaimer => html! { <disclaimer::Page /> },
            Self::Tags => html! { <tags::Page /> },
            Self::NotFound => html! { <not_found::Page /> },
        }
    }
}
