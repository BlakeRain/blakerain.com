use analytics_model::view::{self, create_page_view, PageView};
use poem::{
    handler,
    web::{Data, Json, Path},
};
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use uuid::Uuid;

use crate::env::Env;

#[derive(Deserialize)]
pub struct PageViewBody {
    path: Option<String>,
    ua: Option<String>,
    vw: Option<i32>,
    vh: Option<i32>,
    sw: Option<i32>,
    sh: Option<i32>,
    tz: Option<String>,
    rf: Option<String>,
}

#[derive(Serialize)]
pub struct PageViewResponse {
    id: Option<Uuid>,
}

#[handler]
pub async fn record_page_view(
    env: Data<&Env>,
    Json(PageViewBody {
        path,
        ua,
        vw,
        vh,
        sw,
        sh,
        tz,
        rf,
    }): Json<PageViewBody>,
) -> poem::Result<Json<PageViewResponse>> {
    let id = if let Some(path) = path {
        let id = Uuid::new_v4();
        let view = PageView {
            id,
            path,
            time: OffsetDateTime::now_utc(),
            user_agent: ua,
            viewport_width: vw,
            viewport_height: vh,
            screen_width: sw,
            screen_height: sh,
            timezone: tz,
            referrer: rf,
            beacon: false,
            duration: None,
            scroll: None,
        };

        if let Err(err) = create_page_view(&env.pool, view).await {
            log::error!("Failed to record page view: {err:?}");
            None
        } else {
            Some(id)
        }
    } else {
        log::info!("Ignoring request for pageview image with no path");
        None
    };

    Ok(Json(PageViewResponse { id }))
}

#[derive(Deserialize)]
pub struct AppendPageViewBody {
    duration: f64,
    scroll: f64,
}

#[handler]
pub async fn append_page_view(
    env: Data<&Env>,
    Path(id): Path<Uuid>,
    Json(AppendPageViewBody { duration, scroll }): Json<AppendPageViewBody>,
) -> poem::Result<Json<()>> {
    if let Err(err) = view::append_page_view(&env.pool, id, duration, scroll).await {
        log::error!("Failed to append page view: {err:?}");
    }

    Ok(Json(()))
}
