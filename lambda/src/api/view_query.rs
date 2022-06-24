use std::collections::HashMap;

use aws_sdk_dynamodb::model::AttributeValue;
use http::Response;
use lambda_http::{Body, Request};
use lambda_runtime::Error;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    env::Env,
    model::dynamodb::{
        attribute::{get_attr, get_attr_or, Attribute, AttributeError},
        item::FromItemError,
    },
};

use super::utils::{add_standard_headers, build_json, from_request};

#[derive(Deserialize)]
struct WeekViewReq {
    token: String,
    path: String,
    year: i32,
    week: i32,
}

#[derive(Deserialize)]
struct MonthViewReq {
    token: String,
    path: String,
    year: i32,
    month: i32,
}

#[derive(Deserialize)]
struct WeekBrowserReq {
    token: String,
    year: i32,
    week: i32,
}

#[derive(Deserialize)]
struct MonthBrowserReq {
    token: String,
    year: i32,
    month: i32,
}

#[derive(Deserialize)]
struct WeekPagesReq {
    token: String,
    year: i32,
    week: i32,
}

#[derive(Deserialize)]
struct MonthPagesReq {
    token: String,
    year: i32,
    month: i32,
}

#[derive(Serialize)]
struct WeekViewRes {
    year: i32,
    week: i32,
    day: i32,
    count: i32,
    scroll: u64,
    duration: u64,
}

#[derive(Serialize)]
struct MonthViewRes {
    year: i32,
    month: i32,
    day: i32,
    count: i32,
    scroll: u64,
    duration: u64,
}

#[derive(Serialize)]
struct WeekBrowserRes {
    browser: String,
    year: i32,
    week: i32,
    day: i32,
    count: i32,
}

#[derive(Serialize)]
struct MonthBrowserRes {
    browser: String,
    year: i32,
    month: i32,
    day: i32,
    count: i32,
}

#[derive(Serialize)]
struct PagesRes {
    page: String,
    count: i32,
}

trait ViewQuery {
    type Response: Sized;

    fn token(&self) -> &str;
    fn path(&self) -> String;
    fn section(&self) -> Option<String>;
    fn projection(&self) -> Option<String>;
    fn from(&self, item: HashMap<String, AttributeValue>) -> Result<Self::Response, FromItemError>;
}

impl ViewQuery for WeekViewReq {
    type Response = WeekViewRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        self.path.clone()
    }

    fn section(&self) -> Option<String> {
        Some(format!("Week-{}-{:02}", self.year, self.week))
    }

    fn projection(&self) -> Option<String> {
        Some("ViewDay, ViewCount, TotalScroll, TotalDuration".to_string())
    }

    fn from(
        &self,
        mut item: HashMap<String, AttributeValue>,
    ) -> Result<WeekViewRes, FromItemError> {
        Ok(WeekViewRes {
            year: self.year,
            week: self.week,
            day: get_attr::<String>(&mut item, "ViewDay")?
                .parse()
                .map_err(|err| {
                    FromItemError::AttributeError(
                        "ViewDay".to_string(),
                        AttributeError::ParseError(format!("{:?}", err)),
                    )
                })?,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
            scroll: get_attr_or(&mut item, "TotalScroll", 0)?,
            duration: get_attr_or(&mut item, "TotalDuration", 0)?,
        })
    }
}

impl ViewQuery for MonthViewReq {
    type Response = MonthViewRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        self.path.to_string()
    }

    fn section(&self) -> Option<String> {
        Some(format!("Month-{}-{:02}", self.year, self.month))
    }

    fn projection(&self) -> Option<String> {
        Some("ViewDay, ViewCount, TotalScroll, TotalDuration".to_string())
    }

    fn from(
        &self,
        mut item: HashMap<String, AttributeValue>,
    ) -> Result<MonthViewRes, FromItemError> {
        Ok(MonthViewRes {
            year: self.year,
            month: self.month,
            day: get_attr::<String>(&mut item, "ViewDay")?
                .parse()
                .map_err(|err| {
                    FromItemError::AttributeError(
                        "ViewDay".to_string(),
                        AttributeError::ParseError(format!("{:?}", err)),
                    )
                })?,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
            scroll: get_attr_or(&mut item, "TotalScroll", 0)?,
            duration: get_attr_or(&mut item, "TotalDuration", 0)?,
        })
    }
}

impl ViewQuery for WeekBrowserReq {
    type Response = WeekBrowserRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        "site".to_string()
    }

    fn section(&self) -> Option<String> {
        Some(format!("Week-{}-{:02}", self.year, self.week))
    }

    fn projection(&self) -> Option<String> {
        Some("#S, ViewDay, ViewCount".to_string())
    }

    fn from(
        &self,
        mut item: HashMap<String, AttributeValue>,
    ) -> Result<WeekBrowserRes, FromItemError> {
        let section = get_attr::<String>(&mut item, "Section")?;
        let (_, browser) = section.split_once("#").unwrap();

        Ok(WeekBrowserRes {
            year: self.year,
            week: self.week,
            browser: browser.to_string(),
            day: get_attr::<String>(&mut item, "ViewDay")?
                .parse()
                .map_err(|err| {
                    FromItemError::AttributeError(
                        "ViewDay".to_string(),
                        AttributeError::ParseError(format!("{:?}", err)),
                    )
                })?,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
        })
    }
}

impl ViewQuery for MonthBrowserReq {
    type Response = MonthBrowserRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        "site".to_string()
    }

    fn section(&self) -> Option<String> {
        Some(format!("Month-{}-{:02}", self.year, self.month))
    }

    fn projection(&self) -> Option<String> {
        Some("#S, ViewDay, ViewCount".to_string())
    }

    fn from(
        &self,
        mut item: HashMap<String, AttributeValue>,
    ) -> Result<MonthBrowserRes, FromItemError> {
        let section = get_attr::<String>(&mut item, "Section")?;
        let (_, browser) = section.split_once("#").unwrap();

        Ok(MonthBrowserRes {
            year: self.year,
            month: self.month,
            browser: browser.to_string(),
            day: get_attr::<String>(&mut item, "ViewDay")?
                .parse()
                .map_err(|err| {
                    FromItemError::AttributeError(
                        "ViewDay".to_string(),
                        AttributeError::ParseError(format!("{:?}", err)),
                    )
                })?,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
        })
    }
}

impl ViewQuery for WeekPagesReq {
    type Response = PagesRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        format!("page-view-week-{:04}-{:02}", self.year, self.week)
    }

    fn section(&self) -> Option<String> {
        None
    }

    fn projection(&self) -> Option<String> {
        Some("#S, ViewCount".to_string())
    }

    fn from(&self, mut item: HashMap<String, AttributeValue>) -> Result<PagesRes, FromItemError> {
        let section = get_attr::<String>(&mut item, "Section")?;

        Ok(PagesRes {
            page: section,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
        })
    }
}

impl ViewQuery for MonthPagesReq {
    type Response = PagesRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn path(&self) -> String {
        format!("page-view-month-{:04}-{:02}", self.year, self.month)
    }

    fn section(&self) -> Option<String> {
        None
    }

    fn projection(&self) -> Option<String> {
        Some("#S, ViewCount".to_string())
    }

    fn from(&self, mut item: HashMap<String, AttributeValue>) -> Result<PagesRes, FromItemError> {
        let section = get_attr::<String>(&mut item, "Section")?;

        Ok(PagesRes {
            page: section,
            count: get_attr_or(&mut item, "ViewCount", 0)?,
        })
    }
}
async fn query_views(
    env: &Env,
    path: &str,
    section: Option<String>,
    projection: Option<String>,
) -> Result<Vec<HashMap<String, AttributeValue>>, Error> {
    let mut query = env
        .ddb
        .query()
        .table_name(env.table_name.to_owned())
        .expression_attribute_names("#P", "Path")
        .expression_attribute_names("#S", "Section")
        .set_projection_expression(projection);

    if let Some(section) = section {
        query = query
            .key_condition_expression("#P = :p AND begins_with(#S, :s)")
            .expression_attribute_values(":p", path.to_string().into_attr())
            .expression_attribute_values(":s", section.to_string().into_attr());
    } else {
        query = query
            .key_condition_expression("#P = :p")
            .expression_attribute_values(":p", path.to_string().into_attr());
    }

    let res = query.send().await?;

    Ok(res.items().unwrap_or(&[]).into())
}

fn map_items<T: ViewQuery>(
    body: T,
    items: Vec<HashMap<String, AttributeValue>>,
) -> Result<Vec<T::Response>, Error> {
    let results = items
        .into_iter()
        .map(|item| body.from(item).map_err(Into::into))
        .collect::<Result<Vec<_>, Error>>()?;
    Ok(results)
}

async fn handle_query_views<'a, T: ViewQuery + Deserialize<'a>>(
    env: &Env,
    request: &'a Request,
    path_override: Option<&str>,
) -> Result<Response<Body>, Error>
where
    <T as ViewQuery>::Response: Serialize,
{
    let body = from_request::<T>(request)?;

    if !(env.validate_token(body.token()).await?) {
        return Ok(build_json(
            403,
            json!({
                "error": "Invalid authentication token"
            }),
        ));
    }

    let items = query_views(
        env,
        path_override.unwrap_or(&body.path()),
        body.section(),
        body.projection(),
    )
    .await?;
    let result = map_items(body, items)?;

    Ok(
        add_standard_headers(Response::builder().status(200), "application/json")
            .body(
                serde_json::to_string(&result)
                    .expect("Unable to serialize JSON body")
                    .into(),
            )
            .expect("Unable to build response"),
    )
}

pub async fn handle_views_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekViewReq>(env, request, None).await
}

pub async fn handle_views_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthViewReq>(env, request, None).await
}

pub async fn handle_browsers_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekBrowserReq>(env, request, Some("browser")).await
}

pub async fn handle_browsers_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthBrowserReq>(env, request, Some("browser")).await
}

pub async fn handle_pages_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekPagesReq>(env, request, None).await
}

pub async fn handle_pages_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthPagesReq>(env, request, None).await
}
