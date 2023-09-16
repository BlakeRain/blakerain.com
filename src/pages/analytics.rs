use enum_iterator::Sequence;
use yew::{html, Html};
use yew_router::{prelude::Redirect, Routable};

use super::Route;

mod auth;
mod dashboard;

#[derive(Debug, Clone, Routable, Sequence, PartialEq)]
pub enum AnalyticsRoute {
    #[at("/analytics")]
    Dashboard,
    #[not_found]
    #[at("/analytics/404")]
    NotFound,
}

impl AnalyticsRoute {
    pub fn switch(self) -> Html {
        match self {
            Self::Dashboard => html! { <dashboard::Page /> },
            Self::NotFound => html! { <Redirect<Route> to={Route::NotFound} /> },
        }
    }
}
