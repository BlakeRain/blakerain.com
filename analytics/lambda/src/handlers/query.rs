use analytics_model::{user::User, view::PageViewsMonth};
use poem::{
    error::InternalServerError,
    handler,
    web::{Data, Json, Path},
};
use serde::Serialize;

use crate::env::Env;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct PageViewsPathCount {
    pub path: String,
    pub count: i64,
    pub beacons: i64,
    pub avg_duration: f64,
    pub avg_scroll: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PageViewsMonthResult {
    pub site: PageViewsPathCount,
    pub views: Vec<PageViewsMonth>,
    pub paths: Vec<PageViewsPathCount>,
}

#[handler]
pub async fn query_month_view(
    env: Data<&Env>,
    _: Data<&User>,
    Path((year, month)): Path<(i32, i32)>,
) -> poem::Result<Json<PageViewsMonthResult>> {
    let views = sqlx::query_as::<_, PageViewsMonth>(
        "SELECT * FROM page_views_month WHERE path = $1 AND year = $2 AND month = $3 ORDER BY day",
    )
    .bind("")
    .bind(year)
    .bind(month)
    .fetch_all(&env.pool)
    .await
    .map_err(InternalServerError)?;

    let mut paths = sqlx::query_as::<_, PageViewsPathCount>(
        "SELECT path,
                SUM(count) AS count,
                SUM(total_beacon) AS beacons,
                SUM(total_duration) / SUM(total_beacon) AS avg_duration,
                SUM(total_scroll) / SUM(total_beacon) AS avg_scroll
        FROM page_views_month WHERE year = $1 AND month = $2 GROUP BY path",
    )
    .bind(year)
    .bind(month)
    .fetch_all(&env.pool)
    .await
    .map_err(InternalServerError)?;

    let site = if let Some(index) = paths.iter().position(|count| count.path.is_empty()) {
        paths.swap_remove(index)
    } else {
        PageViewsPathCount {
            path: String::new(),
            count: 0,
            beacons: 0,
            avg_duration: 0.0,
            avg_scroll: 0.0,
        }
    };

    Ok(Json(PageViewsMonthResult { site, views, paths }))
}
