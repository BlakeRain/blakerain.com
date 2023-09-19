use analytics_model::{
    query::{query_page_views, PageViewsQueryResult},
    user::User,
    view::{PageViewsDay, PageViewsMonth, PageViewsWeek},
};
use poem::{
    error::InternalServerError,
    handler,
    web::{Data, Json, Path},
};

use crate::env::Env;

#[handler]
pub async fn query_month_view(
    env: Data<&Env>,
    _: Data<&User>,
    Path(path): Path<(i32, i32)>,
) -> poem::Result<Json<PageViewsQueryResult<PageViewsMonth>>> {
    query_page_views(&env.pool, path)
        .await
        .map_err(InternalServerError)
        .map(Json)
}

#[handler]
pub async fn query_week_view(
    env: Data<&Env>,
    _: Data<&User>,
    Path(path): Path<(i32, i32)>,
) -> poem::Result<Json<PageViewsQueryResult<PageViewsWeek>>> {
    query_page_views(&env.pool, path)
        .await
        .map_err(InternalServerError)
        .map(Json)
}

#[handler]
pub async fn query_day_view(
    env: Data<&Env>,
    _: Data<&User>,
    Path(path): Path<(i32, i32, i32)>,
) -> poem::Result<Json<PageViewsQueryResult<PageViewsDay>>> {
    query_page_views(&env.pool, path)
        .await
        .map_err(InternalServerError)
        .map(Json)
}
