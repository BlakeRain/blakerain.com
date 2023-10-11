use serde::Serialize;
use sqlx::{query_builder::Separated, PgPool, QueryBuilder};

use crate::view::{PageViewsDay, PageViewsMonth, PageViewsWeek};

#[derive(Debug, Default, Clone, sqlx::FromRow, Serialize)]
pub struct PageViewsPathCount {
    pub path: String,
    pub count: i64,
    pub beacons: i64,
    pub total_duration: f64,
    pub total_scroll: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PageViewsQueryResult<T> {
    pub site: PageViewsPathCount,
    pub views: Vec<T>,
    pub paths: Vec<PageViewsPathCount>,
}

pub trait PageViewsQuery {
    type Args;

    fn table_name() -> &'static str;
    fn order_column() -> &'static str;
    fn add_conditions(cond: &mut Separated<sqlx::Postgres, &str>, args: &Self::Args);
}

impl PageViewsQuery for PageViewsDay {
    type Args = (i32, i32, i32);

    fn table_name() -> &'static str {
        "page_views_day"
    }

    fn order_column() -> &'static str {
        "hour"
    }

    fn add_conditions(cond: &mut Separated<sqlx::Postgres, &str>, (year, month, day): &Self::Args) {
        cond.push("year = ");
        cond.push_bind_unseparated(*year);
        cond.push("month = ");
        cond.push_bind_unseparated(*month);
        cond.push("day = ");
        cond.push_bind_unseparated(*day);
    }
}

impl PageViewsQuery for PageViewsWeek {
    type Args = (i32, i32);

    fn table_name() -> &'static str {
        "page_views_week"
    }

    fn order_column() -> &'static str {
        "dow"
    }

    fn add_conditions(cond: &mut Separated<sqlx::Postgres, &str>, (year, week): &Self::Args) {
        cond.push("year = ");
        cond.push_bind_unseparated(*year);
        cond.push("week = ");
        cond.push_bind_unseparated(*week);
    }
}

impl PageViewsQuery for PageViewsMonth {
    type Args = (i32, i32);

    fn table_name() -> &'static str {
        "page_views_month"
    }

    fn order_column() -> &'static str {
        "day"
    }

    fn add_conditions(cond: &mut Separated<sqlx::Postgres, &str>, (year, month): &Self::Args) {
        cond.push("year = ");
        cond.push_bind_unseparated(*year);
        cond.push("month = ");
        cond.push_bind_unseparated(*month);
    }
}

async fn query_page_view_rows<T>(pool: &PgPool, path: &str, args: &T::Args) -> sqlx::Result<Vec<T>>
where
    T: PageViewsQuery + for<'r> sqlx::FromRow<'r, sqlx::postgres::PgRow> + Send + Unpin,
{
    let mut query = QueryBuilder::new("SELECT * FROM ");
    query.push(T::table_name());
    query.push(" WHERE ");

    {
        let mut cond = query.separated(" AND ");
        cond.push("path = ");
        cond.push_bind_unseparated(path);
        T::add_conditions(&mut cond, args);
    }

    query.push(" ORDER BY ");
    query.push(T::order_column());

    query.build_query_as::<T>().fetch_all(pool).await
}

async fn query_page_views_paths<T>(
    pool: &PgPool,
    args: &T::Args,
) -> sqlx::Result<Vec<PageViewsPathCount>>
where
    T: PageViewsQuery,
{
    let mut query = QueryBuilder::new("SELECT ");
    query.push("path, ");
    query.push("SUM(count) AS count, ");
    query.push("SUM(total_beacon) AS beacons, ");
    query.push("SUM(total_duration) AS total_duration, ");
    query.push("SUM(total_scroll) AS total_scroll FROM ");
    query.push(T::table_name());
    query.push(" WHERE ");

    {
        let mut cond = query.separated(" AND ");
        T::add_conditions(&mut cond, args);
    }

    query.push(" GROUP BY path");

    query
        .build_query_as::<PageViewsPathCount>()
        .fetch_all(pool)
        .await
}

pub async fn query_page_views<T>(
    pool: &PgPool,
    args: T::Args,
) -> sqlx::Result<PageViewsQueryResult<T>>
where
    T: PageViewsQuery + for<'r> sqlx::FromRow<'r, sqlx::postgres::PgRow> + Send + Unpin,
{
    let views = query_page_view_rows(pool, "", &args).await?;
    let mut paths = query_page_views_paths::<T>(pool, &args).await?;
    let site = if let Some(index) = paths.iter().position(|count| count.path.is_empty()) {
        paths.swap_remove(index)
    } else {
        PageViewsPathCount::default()
    };

    Ok(PageViewsQueryResult { site, views, paths })
}
