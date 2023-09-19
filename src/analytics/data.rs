use serde::Serialize;

#[derive(Serialize)]
pub struct AnalyticsData {
    path: Option<String>,
    ua: Option<String>,
    vw: Option<i32>,
    vh: Option<i32>,
    sw: Option<i32>,
    sh: Option<i32>,
    tz: Option<String>,
    rf: Option<String>,
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
            tz: super::bindings::get_timezone(),
            rf: Some(super::bindings::get_referrer()),
        }
    }

    pub fn path(&self) -> Option<&str> {
        self.path.as_deref()
    }
}

#[inline]
fn quick_f64_to_i32(value: f64) -> i32 {
    value as i32
}
