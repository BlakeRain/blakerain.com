use sqlx::PgPool;
use time::OffsetDateTime;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PageView {
    pub id: Uuid,
    pub path: String,
    pub time: OffsetDateTime,
    pub user_agent: Option<String>,
    pub viewport_width: Option<i32>,
    pub viewport_height: Option<i32>,
    pub screen_width: Option<i32>,
    pub screen_height: Option<i32>,
    pub timezone: Option<String>,
    pub referrer: Option<String>,
    pub beacon: bool,
    pub duration: Option<f64>,
    pub scroll: Option<f64>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PageViewsDay {
    pub id: i32,
    pub path: String,
    pub year: i32,
    pub month: i32,
    pub day: i32,
    pub hour: i32,
    pub count: i32,
    pub total_beacon: i32,
    pub total_scroll: f64,
    pub total_duration: f64,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PageViewsWeek {
    pub id: i32,
    pub path: String,
    pub year: i32,
    pub week: i32,
    pub dow: i32,
    pub count: i32,
    pub total_beacon: i32,
    pub total_scroll: f64,
    pub total_duration: f64,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct PageViewsMonth {
    pub id: i32,
    pub path: String,
    pub year: i32,
    pub month: i32,
    pub day: i32,
    pub count: i32,
    pub total_beacon: i32,
    pub total_scroll: f64,
    pub total_duration: f64,
}

pub async fn create_page_view(pool: &PgPool, view: PageView) -> sqlx::Result<()> {
    sqlx::query(
        "INSERT INTO page_views
        (id, path, time, user_agent,
         viewport_width, viewport_height,
         screen_width, screen_height,
         timezone, referrer,
         beacon, duration, scroll)
    VALUES ($1, $2, $3, $4,
            $5, $6,
            $7, $8,
            $9, $10,
            $11, $12, $13)",
    )
    .bind(view.id)
    .bind(&view.path)
    .bind(view.time)
    .bind(view.user_agent)
    .bind(view.viewport_width)
    .bind(view.viewport_height)
    .bind(view.screen_width)
    .bind(view.screen_height)
    .bind(view.timezone)
    .bind(view.referrer)
    .bind(view.beacon)
    .bind(view.duration)
    .bind(view.scroll)
    .execute(pool)
    .await?;

    update_count_accumulators(pool, &view.path, view.time).await?;
    update_count_accumulators(pool, "", view.time).await?;

    Ok(())
}

async fn update_count_accumulators(
    pool: &PgPool,
    path: &str,
    time: OffsetDateTime,
) -> sqlx::Result<()> {
    sqlx::query(
        "
        INSERT INTO page_views_day
            (path, year, month, day, hour, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, $5, 1, 0, 0, 0)
        ON CONFLICT (path, year, month, day, hour)
        DO UPDATE SET
            count = page_views_day.count + 1
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.month() as i32)
    .bind(time.day() as i32)
    .bind(time.hour() as i32)
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO page_views_week
            (path, year, week, dow, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, 1, 0, 0, 0)
        ON CONFLICT (path, year, week, dow)
        DO UPDATE SET
            count = page_views_week.count + 1
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.iso_week() as i32)
    .bind(time.weekday().number_days_from_sunday() as i32)
    .bind(time.hour() as i32)
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO page_views_month
            (path, year, month, day, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, 1, 0, 0, 0)
        ON CONFLICT (path, year, month, day)
        DO UPDATE SET
            count = page_views_month.count + 1
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.month() as i32)
    .bind(time.day() as i32)
    .bind(time.hour() as i32)
    .execute(pool)
    .await?;

    Ok(())
}

struct Accumulators {
    duration: f64,
    scroll: f64,
    count_delta: i32,
    duration_delta: f64,
    scroll_delta: f64,
}

async fn update_beacon_accumulators(
    pool: &PgPool,
    path: &str,
    time: OffsetDateTime,
    Accumulators {
        duration,
        scroll,
        count_delta,
        duration_delta,
        scroll_delta,
    }: Accumulators,
) -> sqlx::Result<()> {
    sqlx::query(
        "
        INSERT INTO page_views_day
            (path, year, month, day, hour, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, $5, 1, 1, $6, $7)
        ON CONFLICT (path, year, month, day, hour)
        DO UPDATE SET
            total_beacon = page_views_day.total_beacon + $8,
            total_scroll = page_views_day.total_scroll + $9,
            total_duration = page_views_day.total_duration + $10
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.month() as i32)
    .bind(time.day() as i32)
    .bind(time.hour() as i32)
    .bind(scroll)
    .bind(duration)
    .bind(count_delta)
    .bind(scroll_delta)
    .bind(duration_delta)
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO page_views_week
            (path, year, week, dow, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, 1, 1, $5, $6)
        ON CONFLICT (path, year, week, dow)
        DO UPDATE SET
            total_beacon = page_views_week.total_beacon + $7,
            total_scroll = page_views_week.total_scroll + $8,
            total_duration = page_views_week.total_duration + $9
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.iso_week() as i32)
    .bind(time.weekday().number_days_from_sunday() as i32)
    .bind(scroll)
    .bind(duration)
    .bind(count_delta)
    .bind(scroll_delta)
    .bind(duration_delta)
    .execute(pool)
    .await?;

    sqlx::query(
        "
        INSERT INTO page_views_month
            (path, year, month, day, count, total_beacon, total_scroll, total_duration)
        VALUES
            ($1, $2, $3, $4, 1, 1, $5, $6)
        ON CONFLICT (path, year, month, day)
        DO UPDATE SET
            total_beacon = page_views_month.total_beacon + $7,
            total_scroll = page_views_month.total_scroll + $8,
            total_duration = page_views_month.total_duration + $9
          ",
    )
    .bind(path)
    .bind(time.year())
    .bind(time.month() as i32)
    .bind(time.day() as i32)
    .bind(scroll)
    .bind(duration)
    .bind(count_delta)
    .bind(scroll_delta)
    .bind(duration_delta)
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn append_page_view(
    pool: &PgPool,
    uuid: Uuid,
    duration: f64,
    scroll: f64,
) -> sqlx::Result<()> {
    let view = match sqlx::query_as::<_, PageView>("SELECT * FROM page_views WHERE id = $1")
        .bind(uuid)
        .fetch_optional(pool)
        .await?
    {
        Some(view) => view,
        None => {
            log::warn!("Ignoring append for page view '{uuid}' which does not exist");
            return Ok(());
        }
    };

    // If the beacon has already been received, we want to subtract the last recorded duration and
    // scroll distance from our totals before we then add the new duration and scroll distance.
    let (count_delta, duration_delta, scroll_delta) = if view.beacon {
        (
            0,
            duration - view.duration.unwrap_or(0.0),
            scroll - view.scroll.unwrap_or(0.0),
        )
    } else {
        (1, duration, scroll)
    };

    // Update the page view record with the received duration and scroll distance, and set the
    // beacon flag so we know we've recorded this beacon data into our accumulators.
    sqlx::query("UPDATE page_views SET duration = $1, scroll = $2, beacon = $3 WHERE id = $4")
        .bind(duration)
        .bind(scroll)
        .bind(true)
        .bind(uuid)
        .execute(pool)
        .await?;

    // Update the accumulated statistics for the page view path, and the site overall.

    update_beacon_accumulators(
        pool,
        &view.path,
        view.time,
        Accumulators {
            duration,
            scroll,
            count_delta,
            duration_delta,
            scroll_delta,
        },
    )
    .await?;
    update_beacon_accumulators(
        pool,
        "",
        view.time,
        Accumulators {
            duration,
            scroll,
            count_delta,
            duration_delta,
            scroll_delta,
        },
    )
    .await?;

    Ok(())
}
