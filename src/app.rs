use yew::{function_component, html, Html, Properties};
use yew_router::Switch;

#[cfg(feature = "static")]
use yew_router::{
    history::{AnyHistory, History, MemoryHistory},
    Router,
};

#[cfg(not(feature = "static"))]
use yew_router::BrowserRouter;

use crate::{
    components::layout::Layout,
    model::{source::ModelProvider, tags::TagsProvider},
    pages::Route,
};

#[function_component(AppContent)]
fn app_content() -> Html {
    html! {
        <ModelProvider>
            <TagsProvider>
                <Layout>
                    <main>
                        <Switch<Route> render={Route::switch} />
                    </main>
                </Layout>
            </TagsProvider>
        </ModelProvider>
    }
}

#[derive(Properties, PartialEq)]
#[cfg_attr(not(feature = "static"), derive(Default))]
pub struct AppProps {
    #[cfg(feature = "static")]
    pub url: String,
}

#[function_component(App)]
#[allow(unused_variables)]
pub fn app(props: &AppProps) -> Html {
    #[cfg(feature = "static")]
    {
        let history = AnyHistory::from(MemoryHistory::default());
        history.push(&props.url);
        html! {
            <Router history={history}>
                <AppContent />
            </Router>
        }
    }

    #[cfg(not(feature = "static"))]
    html! {
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    }
}
