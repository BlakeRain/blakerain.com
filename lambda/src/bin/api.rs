use std::collections::HashMap;

use aws_sdk_dynamodb::model::AttributeValue;
use fernet::Fernet;
use lambda_http::{handler, http::Method, Body, Context, Request, RequestExt, Response};
use lambda_runtime::Error;
use pbkdf2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Pbkdf2,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

struct Env {
    pub auth_key: Fernet,
    pub table_name: String,
    pub ddb: aws_sdk_dynamodb::Client,
}

impl Env {
    pub async fn new() -> Self {
        let key = match std::env::var("AUTH_KEY").ok() {
            Some(key) => key,
            None => Fernet::generate_key(),
        };

        let cfg = aws_config::load_from_env().await;

        Env {
            auth_key: Fernet::new(&key).expect("Unable to generate Fernet key"),
            table_name: std::env::var("TABLE_NAME")
                .ok()
                .unwrap_or("analytics".to_owned()),
            ddb: aws_sdk_dynamodb::Client::new(&cfg),
        }
    }

    pub async fn validate_token(&self, token: &str) -> Result<bool, Error> {
        let username = serde_json::from_str::<serde_json::Value>(std::str::from_utf8(
            &self.auth_key.decrypt(token)?,
        )?)?["username"]
            .as_str()
            .expect("Convert to string")
            .to_string();

        let res = self
            .ddb
            .get_item()
            .table_name(self.table_name.to_owned())
            .key("Path", AttributeValue::S("user".to_owned()))
            .key("Section", AttributeValue::S(username))
            .send()
            .await?;

        Ok(res.item().is_some())
    }
}

fn add_standard_headers(
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

async fn handle_page_view(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    let query = request.query_string_parameters();

    if let Some(uuid) = query.get("uuid") {
        if let Some(path) = query.get("path") {
            let mut item: HashMap<String, AttributeValue> = HashMap::new();

            item.insert("Path".to_string(), AttributeValue::S(path.to_string()));

            item.insert(
                "Section".to_string(),
                AttributeValue::S(format!("view-{}", uuid)),
            );

            item.insert(
                "Time".to_string(),
                AttributeValue::S(OffsetDateTime::now_utc().format(&Rfc3339).unwrap()),
            );

            if let Some(ua) = query.get("ua") {
                item.insert("UserAgent".to_string(), AttributeValue::S(ua.to_string()));
            }

            if let Some(viewport_width) = query.get("viewport_width") {
                item.insert(
                    "ViewportWidth".to_string(),
                    AttributeValue::N(viewport_width.to_string()),
                );
            }

            if let Some(viewport_height) = query.get("viewport_height") {
                item.insert(
                    "ViewportHeight".to_string(),
                    AttributeValue::N(viewport_height.to_string()),
                );
            }

            if let Some(screen_width) = query.get("screen_width") {
                item.insert(
                    "ScreenWidth".to_string(),
                    AttributeValue::N(screen_width.to_string()),
                );
            }

            if let Some(screen_height) = query.get("screen_height") {
                item.insert(
                    "ScreenHeight".to_string(),
                    AttributeValue::N(screen_height.to_string()),
                );
            }

            if let Some(timezone) = query.get("tz") {
                item.insert(
                    "Timezone".to_string(),
                    AttributeValue::S(timezone.to_string()),
                );
            }

            if let Some(referrer) = query.get("referrer") {
                item.insert(
                    "Referrer".to_string(),
                    AttributeValue::S(referrer.to_string()),
                );
            }

            if let Some(duration) = query.get("duration") {
                item.insert(
                    "Duration".to_string(),
                    AttributeValue::N(duration.to_string()),
                );
            }

            if let Some(scroll) = query.get("scroll") {
                item.insert("Scroll".to_string(), AttributeValue::N(scroll.to_string()));
            }

            if let Err(err) = env
                .ddb
                .put_item()
                .table_name(env.table_name.to_string())
                .set_item(Some(item))
                .send()
                .await
            {
                println!("Failed to insert item: {:?}", err);
            }
        }
    }

    Ok(
        add_standard_headers(Response::builder().status(202), "image/gif")
            .body(Body::Empty)
            .expect("Failed to build response"),
    )
}

fn from_request<'a, T: Deserialize<'a>>(request: &'a Request) -> Result<T, Error> {
    if let Body::Text(json_str) = request.body() {
        serde_json::from_str::<T>(json_str).map_err(|_| "Failed to parse JSON body".into())
    } else {
        Err("Expected JSON request body".into())
    }
}

#[derive(Serialize, Deserialize)]
struct SignInBody {
    username: String,
    password: String,
}

async fn handle_auth_signin(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    // Parse the sign in data from the request body
    let body = from_request::<SignInBody>(request)?;

    // Query the database for the username
    let res = env
        .ddb
        .get_item()
        .table_name(env.table_name.to_owned())
        .key("Path", AttributeValue::S("user".to_owned()))
        .key("Section", AttributeValue::S(body.username.to_owned()))
        .send()
        .await?;

    if let Some(res) = res.item {
        let password: String = res["Password"]
            .as_s()
            .map_err(|_| "Failed to convert password attribute")?
            .to_string();
        let parsed_hash =
            PasswordHash::new(&password).map_err(|_| "Failed to parse password hash")?;
        let matches = Pbkdf2
            .verify_password(body.password.as_bytes(), &parsed_hash)
            .is_ok();

        let body = if matches {
            json!({
                "token": env.auth_key.encrypt(serde_json::to_string(&json!({
                    "username": res["Section"]
                    .as_s()
                    .map_err(|_| "Failed to convert username to string")?
                    .to_string()
                })).expect("Unable to serialize token content").as_bytes())
            })
        } else {
            json!({
                "error": "Invalid username or password"
            })
        };

        Ok(
            add_standard_headers(Response::builder(), "application/json")
                .status(if matches { 200 } else { 403 })
                .body(
                    serde_json::to_string(&body)
                        .expect("Unable to serialize JSON body")
                        .into(),
                )
                .expect("Unable to build response"),
        )
    } else {
        println!("Unable to find user with username '{}'", body.username);
        return Err("Invalid username or password".into());
    }
}

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
}

#[derive(Serialize)]
struct MonthViewRes {
    year: i32,
    month: i32,
    day: i32,
    count: i32,
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

fn i32_from_s_attr(item: &HashMap<String, AttributeValue>, name: &str) -> i32 {
    match item[name].as_s() {
        Ok(str) => match i32::from_str_radix(str, 10) {
            Ok(n) => n,
            Err(err) => {
                println!("Failed to parse '{}' attribute as integer: {}", name, err);
                0
            }
        },
        Err(_) => {
            println!("Failed to extract '{}' attribute as string", name);
            0
        }
    }
}

fn i32_from_n_attr(item: &HashMap<String, AttributeValue>, name: &str) -> i32 {
    match item[name].as_n() {
        Ok(str) => match i32::from_str_radix(str, 10) {
            Ok(n) => n,
            Err(err) => {
                println!("Failed to parse '{}' attribute as integer: {}", name, err);
                0
            }
        },
        Err(_) => {
            println!("Failed to extract '{}' attribute as number", name);
            0
        }
    }
}

trait ViewQuery {
    type Response;

    fn token(&self) -> &str;
    fn section(&self) -> String;
    fn from(&self, item: &HashMap<String, AttributeValue>) -> Self::Response;
}

impl ViewQuery for WeekViewReq {
    type Response = WeekViewRes;

    fn token(&self) -> &str {
        &self.token
    }

    fn section(&self) -> String {
        format!("Week-{}-{:02}", self.year, self.week)
    }

    fn from(&self, item: &HashMap<String, AttributeValue>) -> WeekViewRes {
        WeekViewRes {
            year: self.year,
            week: self.week,
            day: i32_from_s_attr(item, "ViewDay"),
            count: i32_from_n_attr(item, "ViewCount"),
        }
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

    fn from(&self, item: &HashMap<String, AttributeValue>) -> MonthViewRes {
        MonthViewRes {
            year: self.year,
            month: self.month,
            day: i32_from_s_attr(item, "ViewDay"),
            count: i32_from_n_attr(item, "ViewCount"),
        }
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

    fn from(&self, item: &HashMap<String, AttributeValue>) -> WeekBrowserRes {
        let (_, browser) = item["Section"]
            .as_s()
            .expect("Section to be string")
            .split_once("#")
            .unwrap();

        WeekBrowserRes {
            year: self.year,
            week: self.week,
            browser: browser.to_string(),
            day: i32_from_s_attr(item, "ViewDay"),
            count: i32_from_n_attr(item, "ViewCount"),
        }
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

    fn from(&self, item: &HashMap<String, AttributeValue>) -> MonthBrowserRes {
        let (_, browser) = item["Section"]
            .as_s()
            .expect("Section to be a string")
            .split_once("#")
            .unwrap();

        MonthBrowserRes {
            year: self.year,
            month: self.month,
            browser: browser.to_string(),
            day: i32_from_s_attr(item, "ViewDay"),
            count: i32_from_n_attr(item, "ViewCount"),
        }
    }
}

async fn query_views(
    env: &Env,
    path: &str,
    section: &str,
) -> Result<Vec<HashMap<String, AttributeValue>>, Error> {
    let res = env
        .ddb
        .query()
        .table_name(env.table_name.to_owned())
        .key_condition_expression("#P = :v1 AND begins_with(#S, :v2)")
        .expression_attribute_names("#P", "Path")
        .expression_attribute_names("#S", "Section")
        .expression_attribute_values(":v1", AttributeValue::S(path.to_string()))
        .expression_attribute_values(":v2", AttributeValue::S(section.to_string()))
        .send()
        .await?;

    Ok(res.items().unwrap_or(&[]).into())
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

    let items = query_views(env, path, &body.section()).await?;

    let body: Vec<T::Response> = items.iter().map(|item| body.from(item)).collect();
    Ok(
        add_standard_headers(Response::builder().status(200), "application/json")
            .body(
                serde_json::to_string(&body)
                    .expect("Unable to serialize JSON body")
                    .into(),
            )
            .expect("Unable to build response"),
    )
}

async fn handle_views_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekViewReq>(env, request, "site").await
}

async fn handle_views_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthViewReq>(env, request, "site").await
}

async fn handle_browsers_week(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<WeekBrowserReq>(env, request, "browser").await
}

async fn handle_browsers_month(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    handle_query_views::<MonthBrowserReq>(env, request, "browser").await
}

fn build_json(status: u16, body: serde_json::Value) -> Response<Body> {
    let builder = add_standard_headers(Response::builder().status(status), "application/json");
    builder
        .body(
            serde_json::to_string(&body)
                .expect("Unable to serialize JSON body")
                .into(),
        )
        .expect("Unable to build response")
}

async fn api_handler(env: &Env, request: Request) -> Result<Response<Body>, Error> {
    match *request.method() {
        Method::OPTIONS => Ok(Response::builder()
            .status(204)
            .header("Allow", "OPTIONS, POST")
            .header("Access-Control-Allow-Methods", "AOPTIONS, POST")
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Headers", "*")
            .body(Body::Empty)
            .unwrap()),

        Method::GET => match request.uri().path() {
            "/pv.gif" => handle_page_view(env, &request).await,
            _ => Ok(build_json(404, json!({ "error": "Not Found" }))),
        },

        Method::POST => match request.uri().path() {
            "/api/auth/signin" => handle_auth_signin(env, &request).await,
            "/api/views/week" => handle_views_week(env, &request).await,
            "/api/views/month" => handle_views_month(env, &request).await,
            "/api/browsers/week" => handle_browsers_week(env, &request).await,
            "/api/browsers/month" => handle_browsers_month(env, &request).await,
            _ => Ok(build_json(
                404,
                json!({
                    "error": "Not Found"
                }),
            )),
        },
        _ => Ok(build_json(
            404,
            json!({
                "error": "Not Found"
            }),
        )),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let env = Env::new().await;

    let handler_func_env = &env;
    let handler_func = move |req: Request, _cxt: Context| async move {
        let response = api_handler(handler_func_env, req).await;
        match response {
            Ok(res) => Ok(res),
            Err(err) => {
                println!("Error: {:?}", &err);
                Err(err)
            }
        }
    };

    lambda_runtime::run(handler(handler_func)).await?;
    Ok(())
}
