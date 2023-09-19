use yew::{function_component, html, use_effect_with_deps, use_reducer, Event, Html};
use yew_hooks::{
    use_async, use_async_with_options, use_event_with_window, UseAsyncHandle, UseAsyncOptions,
};
use yew_router::prelude::use_location;

use crate::analytics::{
    api::{record_page_view, AnalyticsResponse},
    beacon::AnalyticsBeaconData,
    bindings::get_position,
    data::AnalyticsData,
    state::{AnalyticsAction, AnalyticsState},
};

fn should_not_track() -> bool {
    let dnt = gloo::utils::window().navigator().do_not_track();
    dnt == "1" || dnt == "yes"
}

#[function_component(Analytics)]
pub fn analytics() -> Html {
    let state = use_reducer(AnalyticsState::default);
    let location = use_location();

    let send_analytics: UseAsyncHandle<(), &'static str> = {
        let state = state.clone();
        use_async_with_options(
            async move {
                if should_not_track() {
                    log::info!("Do Not Track is enabled; analytics will not be sent");
                    return Ok(());
                }

                let data = AnalyticsData::capture();
                let AnalyticsResponse { id } = record_page_view(&data).await?;
                if let Some(id) = id {
                    log::info!(
                        "New page view '{id}' (for '{}')",
                        data.path().unwrap_or_default()
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
        let state = state.clone();
        use_async(async move {
            if should_not_track() {
                log::info!("Do Not Track is enabled; analytics beacon will not be sent");
                return Ok(());
            }

            if let Some(id) = state.view_id() {
                log::info!("Sending beacon for page view '{id}'");
                AnalyticsBeaconData::from(&*state)
                    .send(id)
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
            move |_| {
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
