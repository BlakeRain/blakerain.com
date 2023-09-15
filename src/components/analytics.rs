use std::rc::Rc;

use js_sys::Promise;
use serde::{Deserialize, Serialize};
use time::{Duration, OffsetDateTime};
use uuid::Uuid;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};
use wasm_bindgen_futures::JsFuture;
use yew::{function_component, html, use_effect_with_deps, use_reducer, Event, Html, Reducible};
use yew_hooks::{
    use_async, use_async_with_options, use_event_with_window, UseAsyncHandle, UseAsyncOptions,
};
use yew_router::prelude::use_location;

#[wasm_bindgen(module = "/public/analytics.js")]
extern "C" {
    #[wasm_bindgen(js_name = "getTimezone")]
    fn get_timezone() -> Option<String>;

    #[wasm_bindgen(js_name = "getReferrer")]
    fn get_referrer() -> String;

    #[wasm_bindgen(js_name = "getPosition")]
    fn get_position() -> f64;

    #[wasm_bindgen(catch, js_name = "sendBeacon")]
    fn send_beacon(url: &str, body: &str) -> Result<Promise, JsValue>;
}

#[derive(Serialize)]
struct AnalyticsData {
    path: Option<String>,
    ua: Option<String>,
    vw: Option<i32>,
    vh: Option<i32>,
    sw: Option<i32>,
    sh: Option<i32>,
    tz: Option<String>,
    rf: Option<String>,
}

#[derive(Deserialize)]
struct AnalyticsResponse {
    id: Option<Uuid>,
}

#[inline]
fn quick_f64_to_i32(value: f64) -> i32 {
    value as i32
}

fn should_not_track() -> bool {
    let dnt = gloo::utils::window().navigator().do_not_track();
    dnt == "1" || dnt == "yes"
}

impl AnalyticsData {
    pub fn capture() -> Self {
        let window = gloo::utils::window();

        let path = if let Ok(mut path) = window.location().pathname() {
            if !path.starts_with('/') {
                path.insert(0, '/')
            }

            if path.len() > 1 && path.ends_with('/') {
                path.pop().expect("pop");
            }

            Some(path)
        } else {
            None
        };

        Self {
            path,
            ua: window.navigator().user_agent().ok(),
            vw: window
                .inner_width()
                .expect("inner_width")
                .as_f64()
                .map(quick_f64_to_i32),
            vh: window
                .inner_height()
                .expect("inner_height")
                .as_f64()
                .map(quick_f64_to_i32),
            sw: window.screen().expect("screen").width().ok(),
            sh: window.screen().expect("screen").height().ok(),
            tz: get_timezone(),
            rf: Some(get_referrer()),
        }
    }
}

#[derive(Clone)]
struct AnalyticsState {
    view_id: Option<Uuid>,
    start: OffsetDateTime,
    scroll: f64,
    visibility: VisibilityState,
}

#[derive(Clone)]
enum VisibilityState {
    Unknown,
    Visible {
        total_hidden: Duration,
    },
    Hidden {
        total: Duration,
        start: OffsetDateTime,
    },
}

impl Default for VisibilityState {
    fn default() -> Self {
        Self::Unknown
    }
}

impl VisibilityState {
    fn from_document() -> Self {
        let hidden = gloo::utils::window().document().expect("document").hidden();

        if hidden {
            VisibilityState::Hidden {
                total: Duration::new(0, 0),
                start: OffsetDateTime::now_utc(),
            }
        } else {
            VisibilityState::Visible {
                total_hidden: Duration::new(0, 0),
            }
        }
    }

    fn to_visible(&self) -> Self {
        match self {
            Self::Unknown => Self::Visible {
                total_hidden: Duration::new(0, 0),
            },

            Self::Hidden { total, start } => {
                let hidden = OffsetDateTime::now_utc() - *start;
                let total_hidden = *total + hidden;

                log::info!(
                    "Page is now visible; was hidden for {} second(s) ({} total)",
                    hidden.whole_seconds(),
                    total_hidden.whole_seconds(),
                );

                Self::Visible { total_hidden }
            }

            Self::Visible { .. } => self.clone(),
        }
    }

    fn to_hidden(&self) -> Self {
        match self {
            Self::Unknown => Self::Hidden {
                total: Duration::new(0, 0),
                start: OffsetDateTime::now_utc(),
            },

            Self::Hidden { .. } => self.clone(),

            Self::Visible {
                total_hidden: hidden,
            } => Self::Hidden {
                total: *hidden,
                start: OffsetDateTime::now_utc(),
            },
        }
    }
}

impl AnalyticsState {
    fn new() -> Self {
        Self {
            view_id: None,
            start: OffsetDateTime::now_utc(),
            scroll: 0.0,
            visibility: VisibilityState::default(),
        }
    }

    fn new_with_id(id: Uuid) -> Self {
        Self {
            view_id: Some(id),
            start: OffsetDateTime::now_utc(),
            scroll: get_position().clamp(0.0, 100.0),
            visibility: VisibilityState::from_document(),
        }
    }

    fn get_total_hidden(&self) -> Duration {
        match self.visibility {
            VisibilityState::Unknown => Duration::seconds(0),
            VisibilityState::Visible {
                total_hidden: hidden,
            } => hidden,
            VisibilityState::Hidden { total, start } => total + (OffsetDateTime::now_utc() - start),
        }
    }

    fn get_duration(&self) -> f64 {
        ((OffsetDateTime::now_utc() - self.start) - self.get_total_hidden())
            .abs()
            .clamp(Duration::new(0, 0), Duration::hours(2))
            .as_seconds_f64()
            .round()
    }
}

enum AnalyticsAction {
    NewPageView(Uuid),
    SetScroll(f64),
    VisibilityChanged(bool),
}

impl Reducible for AnalyticsState {
    type Action = AnalyticsAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        match action {
            AnalyticsAction::NewPageView(id) => Self::new_with_id(id),

            AnalyticsAction::SetScroll(distance) => Self {
                scroll: self.scroll.max(distance),
                ..(*self).clone()
            },

            AnalyticsAction::VisibilityChanged(visible) => {
                let visibility = if visible {
                    self.visibility.to_visible()
                } else {
                    self.visibility.to_hidden()
                };

                Self {
                    visibility,
                    ..(*self).clone()
                }
            }
        }
        .into()
    }
}

#[derive(Serialize)]
struct AnalyticsBeaconData {
    duration: f64,
    scroll: f64,
}

impl From<&AnalyticsState> for AnalyticsBeaconData {
    fn from(state: &AnalyticsState) -> Self {
        Self {
            duration: state.get_duration(),
            scroll: 0.0_f64.max(state.scroll),
        }
    }
}

impl AnalyticsBeaconData {
    pub async fn send(&self, url: &str) -> Result<(), JsValue> {
        let body = serde_json::to_string(self).expect("JSON");
        let res = send_beacon(url, &body)?;
        JsFuture::from(res).await?;
        Ok(())
    }
}

pub fn get_analytics_host() -> String {
    let mut host = std::option_env!("ANALYTICS_HOST")
        .unwrap_or("https://analytics.blakerain.com")
        .to_string();

    if !host.ends_with('/') {
        host.push('/');
    }

    host
}

#[function_component(Analytics)]
pub fn analytics() -> Html {
    let host = get_analytics_host();
    let state = use_reducer(AnalyticsState::new);
    let location = use_location();

    let send_analytics: UseAsyncHandle<(), &'static str> = {
        let host = host.clone();
        let state = state.clone();
        use_async_with_options(
            async move {
                if should_not_track() {
                    log::info!("Do Not Track is enabled; analytics will not be sent");
                    return Ok(());
                }

                let data = AnalyticsData::capture();

                let res = reqwest::Client::new()
                    .post(format!("{host}page_view"))
                    .json(&data)
                    .send()
                    .await
                    .map_err(|err| {
                        log::error!("Unable to send analytics data: {err:?}");
                        "Unable to send analytics data"
                    })?;

                let AnalyticsResponse { id } =
                    res.json::<AnalyticsResponse>().await.map_err(|err| {
                        log::error!("Unable to parse analytics response: {err:?}");
                        "Unable to parse analytics response"
                    })?;

                if let Some(id) = id {
                    log::info!(
                        "New page view '{id}' (for '{}')",
                        data.path.unwrap_or_default()
                    );

                    state.dispatch(AnalyticsAction::NewPageView(id));
                } else {
                    log::warn!("Analytics record was not created; received no UUID");
                }

                Ok(())
            },
            UseAsyncOptions::enable_auto(),
        )
    };

    let send_beacon: UseAsyncHandle<(), &'static str> = {
        let host = host.clone();
        let state = state.clone();
        use_async(async move {
            if should_not_track() {
                log::info!("Do Not Track is enabled; analytics beacon will not be sent");
                return Ok(());
            }

            if let Some(id) = state.view_id {
                log::info!("Sending beacon for page view '{id}'");
                AnalyticsBeaconData::from(&*state)
                    .send(&format!("{host}page_view/{id}"))
                    .await
                    .map_err(|err| {
                        log::error!("Failed to send analytics beacon: {err:?}");
                        "Unable to send analytics beacon"
                    })?;
            }

            Ok(())
        })
    };

    {
        let send_beacon = send_beacon.clone();
        use_effect_with_deps(
            move |loc| {
                send_beacon.run();
                send_analytics.run();
            },
            location.map(|loc| loc.path().to_string()),
        )
    }

    {
        let state = state.clone();
        use_event_with_window("scroll", move |_: Event| {
            let distance = get_position();
            state.dispatch(AnalyticsAction::SetScroll(distance));
        })
    }

    {
        let state = state.clone();
        let send_beacon = send_beacon.clone();
        use_event_with_window("visibilitychange", move |_: Event| {
            let hidden = gloo::utils::window().document().expect("document").hidden();
            state.dispatch(AnalyticsAction::VisibilityChanged(!hidden));

            if hidden {
                send_beacon.run();
            }
        })
    }

    {
        let send_beacon = send_beacon.clone();
        use_event_with_window("pagehide", move |_: Event| {
            send_beacon.run();
        })
    }

    html! {}
}
