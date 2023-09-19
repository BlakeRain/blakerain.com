use serde::Serialize;
use uuid::Uuid;
use wasm_bindgen::JsValue;
use wasm_bindgen_futures::JsFuture;

use super::{api::get_analytics_host, state::AnalyticsState};

#[derive(Serialize)]
pub struct AnalyticsBeaconData {
    duration: f64,
    scroll: f64,
}

impl From<&AnalyticsState> for AnalyticsBeaconData {
    fn from(state: &AnalyticsState) -> Self {
        Self {
            duration: state.get_duration(),
            scroll: 0.0_f64.max(state.get_scroll()),
        }
    }
}

impl AnalyticsBeaconData {
    pub async fn send(&self, view_id: Uuid) -> Result<(), JsValue> {
        let host = get_analytics_host();
        let url = format!("{host}page_view/{view_id}");
        let body = serde_json::to_string(self).expect("JSON");
        let res = super::bindings::send_beacon(&url, &body)?;
        JsFuture::from(res).await?;
        Ok(())
    }
}
