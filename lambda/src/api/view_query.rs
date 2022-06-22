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
        attribute::{get_attr, Attribute, AttributeError, get_attr_or},
        item::FromItemError,
    },
};

use super::utils::{add_standard_headers, build_json, from_request};

#[derive(Deserialize)]
struct WeekViewReq {
    token: String,
    year: i32,
    week: i32,
}

#[derive(Deserialize)]
struct MonthViewReq {
    token: String,
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

trait ViewQuery {
    type Response: Sized;

    fn token(&self) -> &str;
    fn section(&self) -> String;
    fn projection(&self) -> Option<String>;
    fn from(&self, item: HashMap<String, AttributeValue>) -> Result<Self::Response, FromItemError>;
}

impl ViewQuery for WeekViewReq {
    type Response = WeekViewRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn section(&self) -> String {
        format!("Week-{}-{:02}", self.year, self.week)
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

    fn section(&self) -> String {
        format!("Month-{}-{:02}", self.year, self.month)
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

    fn section(&self) -> String {
        format!("Week-{}-{:02}", self.year, self.week)
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

    fn section(&self) -> String {
        format!("Month-{}-{:02}", self.year, self.month)
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

async fn query_views(
    env: &Env,
    path: &str,
    section: &str,
    projection: Option<String>,
) -> Result<Vec<HashMap<String, AttributeValue>>, Error> {
    let res = env
        .ddb
        .query()
        .table_name(env.table_name.to_owned())
        .key_condition_expression("#P = :v1 AND begins_with(#S, :v2)")
        .expression_attribute_names("#P", "Path")
        .expression_attribute_names("#S", "Section")
        .expression_attribute_values(":v1", path.to_string().into_attr())
        .expression_attribute_values(":v2", section.to_string().into_attr())
        .set_projection_expression(projection)
        .send()
        .await?;

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
    path: &str,
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

    let items = query_views(env, path, &body.section(), body.projection()).await?;
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
    handle_query_views::<WeekViewReq>(env, request, "site").await
}

pub async fn handle_views_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthViewReq>(env, request, "site").await
}

pub async fn handle_browsers_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekBrowserReq>(env, request, "browser").await
}

pub async fn handle_browsers_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthBrowserReq>(env, request, "browser").await
}
