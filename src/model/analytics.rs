use serde::Deserialize;
use uuid::Uuid;

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
