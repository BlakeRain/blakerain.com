use http::Response;
use lambda_http::{Body, Request};
use lambda_runtime::Error;
use serde::Deserialize;

pub fn from_request<'a, T: Deserialize<'a>>(request: &'a Request) -> Result<T, Error> {
    if let Body::Text(json_str) = request.body() {
        serde_json::from_str::<T>(json_str).map_err(|_| "Failed to parse JSON body".into())
    } else {
        Err("Expected JSON request body".into())
    }
}

pub fn add_standard_headers(
    builder: http::response::Builder,
    content_type: &str,
) -> http::response::Builder {
    builder
        .header("Content-Type", content_type)
        .header("Pragma", "no-cache")
        .header("Access-Control-Allow-Origin", "*")
        .header("Expires", "0")
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .header(
            "Strict-Transport-Security",
            "max-age=31536000, includeSubdomains",
        )
}

pub fn build_json(status: u16, body: serde_json::Value) -> Response<Body> {
    let builder = add_standard_headers(Response::builder().status(status), "application/json");
    builder
        .body(
            serde_json::to_string(&body)
                .expect("Unable to serialize JSON body")
                .into(),
        )
        .expect("Unable to build response")
}
