use std::sync::{Arc, Mutex};

use yew::{function_component, html, ContextProvider, Html, Properties};
use yew_router::{
    history::{AnyHistory, History, MemoryHistory},
    BrowserRouter, Router, Switch,
};

use crate::{components::layout::Layout, pages::Route};

#[function_component(AppContent)]
fn app_content() -> Html {
    html! {
        <Layout>
            <main>
                <Switch<Route> render={Route::switch} />
            </main>
        </Layout>
    }
}

#[derive(Default, Properties, PartialEq)]
pub struct AppProps {}

#[function_component(App)]
#[allow(unused_variables)]
pub fn app(props: &AppProps) -> Html {
    let head = HeadWriter::default();

    html! {
        <ContextProvider<HeadWriter> context={head}>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </ContextProvider<HeadWriter>>
    }
}

#[derive(Default)]
pub struct HeadWriter {
    content: Arc<Mutex<String>>,
}

impl PartialEq for HeadWriter {
    fn eq(&self, _: &Self) -> bool {
        true
    }
}

impl Clone for HeadWriter {
    fn clone(&self) -> Self {
        Self {
            content: Arc::clone(&self.content),
        }
    }
}

impl HeadWriter {
    pub fn take(self) -> String {
        let mut content = self.content.lock().unwrap();
        let mut taken = String::new();
        std::mem::swap(&mut taken, &mut *content);
        taken
    }

    pub fn write_fmt(&self, args: std::fmt::Arguments<'_>) {
        let mut content = self.content.lock().unwrap();
        std::fmt::Write::write_fmt(&mut *content, args).unwrap();
    }
}

#[derive(Properties, PartialEq)]
pub struct StaticAppProps {
    pub url: String,
    pub head: HeadWriter,
}

#[function_component(StaticApp)]
pub fn static_app(props: &StaticAppProps) -> Html {
    let history = AnyHistory::from(MemoryHistory::default());
    history.push(&props.url);

    html! {
        <ContextProvider<HeadWriter> context={props.head.clone()}>
            <Router history={history}>
                <AppContent />
            </Router>
        </ContextProvider<HeadWriter>>
    }
}
