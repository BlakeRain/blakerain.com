use gloo::net::http::Request;
use serde::Deserialize;
use uuid::Uuid;

use super::data::AnalyticsData;

pub fn get_analytics_host() -> String {
    let mut host = std::option_env!("ANALYTICS_HOST")
        .unwrap_or("https://analytics.blakerain.com")
        .to_string();

    if !host.ends_with('/') {
        host.push('/');
    }

    host
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct PageViewsMonth {
    pub id: Uuid,
    pub path: String,
    pub year: i32,
    pub month: i32,
    pub day: i32,
    pub count: i32,
    pub total_beacon: i32,
    pub total_scroll: f64,
    pub total_duration: f64,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct PageViewsPathCount {
    pub path: String,
    pub count: i64,
    pub beacons: i64,
    pub avg_duration: f64,
    pub avg_scroll: f64,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct PageViewsMonthResult {
    pub site: PageViewsPathCount,
    pub views: Vec<PageViewsMonth>,
    pub paths: Vec<PageViewsPathCount>,
}

pub async fn get_month_views(
    token: &str,
    year: i32,
    month: i32,
) -> Result<PageViewsMonthResult, &'static str> {
    let host = get_analytics_host();
    Request::get(&format!("{host}query/month/{year}/{month}"))
        .header("Authorization", &format!("Bearer {token}"))
        .send()
        .await
        .map_err(|err| {
            log::error!("Failed to validate analytics authentication token: {err:?}");
            "Failed to validate analytics authentication token"
        })?
        .json()
        .await
        .map_err(|err| {
            log::error!("Unable to parse analytics token validation response: {err:?}");
            "Unable to parse analytics token validation response"
        })
}

#[derive(Deserialize)]
pub struct AnalyticsResponse {
    pub id: Option<Uuid>,
}

pub async fn record_page_view(data: &AnalyticsData) -> Result<AnalyticsResponse, &'static str> {
    let host = get_analytics_host();
    let res = Request::post(&format!("{host}page_view"))
        .json(data)
        .expect("JSON")
        .send()
        .await
        .map_err(|err| {
            log::error!("Failed to send analytics request: {err:?}");
            "Unable to send analyitcs request"
        })?;

    let res = res.json().await.map_err(|err| {
        log::error!("Unable to parse analytics response: {err:?}");
        "Unable to parse analytics response"
    })?;

    Ok(res)
}
