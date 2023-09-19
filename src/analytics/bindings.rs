use js_sys::Promise;
use wasm_bindgen::{prelude::wasm_bindgen, JsValue};

#[wasm_bindgen(module = "/public/analytics.js")]
extern "C" {
    #[wasm_bindgen(js_name = "getTimezone")]
    pub fn get_timezone() -> Option<String>;

    #[wasm_bindgen(js_name = "getReferrer")]
    pub fn get_referrer() -> String;

    #[wasm_bindgen(js_name = "getPosition")]
    pub fn get_position() -> f64;

    #[wasm_bindgen(catch, js_name = "sendBeacon")]
    pub fn send_beacon(url: &str, body: &str) -> Result<Promise, JsValue>;
}
