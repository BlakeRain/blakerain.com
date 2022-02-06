use aws_sdk_dynamodb::model::AttributeValue;
use fernet::Fernet;
use lambda_http::{handler, http::Method, Body, Context, Request, Response};
use lambda_runtime::Error;
use pbkdf2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Pbkdf2,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

struct State {
    pub auth_key: Fernet,
    pub table_name: String,
    pub ddb: aws_sdk_dynamodb::Client,
}

impl State {
    pub async fn new() -> Self {
        let key = match std::env::var("AUTH_KEY").ok() {
            Some(key) => key,
            None => Fernet::generate_key(),
        };

        let cfg = aws_config::load_from_env().await;

        State {
            auth_key: Fernet::new(&key).expect("Unable to generate Fernet key"),
            table_name: std::env::var("TABLE_NAME")
                .ok()
                .unwrap_or("analytics".to_owned()),
            ddb: aws_sdk_dynamodb::Client::new(&cfg),
        }
    }

    pub async fn validate_token(&self, token: &str) -> Result<bool, Error> {
        let res = self
            .ddb
            .get_item()
            .table_name(self.table_name.to_owned())
            .key("Path", AttributeValue::S("user".to_owned()))
            .key(
                "Section",
                AttributeValue::S(
                    serde_json::from_str::<serde_json::Value>(std::str::from_utf8(
                        &self.auth_key.decrypt(token)?,
                    )?)?["username"]
                        .to_string(),
                ),
            )
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

#[derive(Serialize, Deserialize)]
struct SignInBody {
    username: String,
    password: String,
}

async fn handle_auth_signin(state: &State, request: &Request) -> Result<Response<Body>, Error> {
    if let Body::Text(json_str) = request.body() {
        let value = serde_json::from_str::<SignInBody>(json_str)?;

        let res = state
            .ddb
            .get_item()
            .table_name(state.table_name.to_owned())
            .key("Path", AttributeValue::S("user".to_owned()))
            .key("Section", AttributeValue::S(value.username))
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
                .verify_password(password.as_bytes(), &parsed_hash)
                .is_ok();

            let body = if matches {
                json!({
                    "username": res["Username"]
                        .as_s()
                        .map_err(|_| "Failed to convert username to string")?
                        .to_string()
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
            Err("Invalid username or password".into())
        }
    } else {
        return Err("Unable to parse JSON body".into());
    }
}

#[derive(Serialize, Deserialize)]
struct WeekViewReq {
    token: String,
    year: i32,
    week: i32,
}

#[derive(Serialize, Deserialize)]
struct MonthViewReq {
    token: String,
    year: i32,
    month: i32,
}

#[derive(Serialize, Deserialize)]
struct WeekViewRes {
    year: i32,
    week: i32,
    day: i32,
    count: i32,
}

#[derive(Serialize, Deserialize)]
struct MonthViewRes {
    year: i32,
    month: u32,
    day: u32,
    count: i32,
}

#[derive(Serialize, Deserialize)]
struct WeekBrowserRes {
    browser: String,
    year: i32,
    week: i32,
    day: i32,
    count: i32,
}

#[derive(Serialize, Deserialize)]
struct MonthBrowserRes {
    browser: String,
    year: i32,
    month: i32,
    day: i32,
    count: i32,
}

fn from_request<'a, T: Deserialize<'a>>(request: &'a Request) -> Result<T, Error> {
    if let Body::Text(json_str) = request.body() {
        serde_json::from_str::<T>(json_str).map_err(|_| "Failed to parse JSON body".into())
    } else {
        Err("Expected JSON request body".into())
    }
}

async fn handle_views_week(state: &State, request: &Request) -> Result<Response<Body>, Error> {
    // Parse the body as JSON containing a 'WeekViewReq'
    let body = from_request::<WeekViewReq>(request)?;

    // Validate the token
    if !(state.validate_token(&body.token).await?) {
        return Ok(build_json(
            403,
            json!({
                "error": "Invalid authentication token"
            }),
        ));
    }

    Ok(Response::builder()
        .status(200)
        .body("Ok".into())
        .expect("Unable to build response"))
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

async fn api_handler(state: &State, request: Request) -> Result<Response<Body>, Error> {
    match *request.method() {
        Method::POST => match request.uri().path() {
            "/api/auth/signin" => handle_auth_signin(state, &request).await,
            "/api/views/week" => handle_views_week(state, &request).await,
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
    let state = State::new().await;

    let handler_func_state = &state;
    let handler_func = move |req: Request, _cxt: Context| async move {
        api_handler(handler_func_state, req).await
    };

    lambda_runtime::run(handler(handler_func)).await?;
    Ok(())
}
