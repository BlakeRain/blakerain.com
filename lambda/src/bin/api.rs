use aws_sdk_dynamodb::model::AttributeValue;
use fernet::Fernet;
use lambda_http::{handler, http::Method, Context, Request, Response};
use lambda_runtime::Error;

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

fn standard_json_response(status: http::StatusCode) -> http::response::Builder {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .header("Pragma", "no-cache")
        .header("Access-Control-Allow-Origin", "*")
        .header("Expires", "0")
        .header("Cache-Control", "no-cache, no-store, must-revalidate")
        .header(
            "Strict-Transport-Security",
            "max-age=31536000, includeSubdomains",
        )
}

async fn handle_auth_signin(
    state: &State,
    req: http::Request<serde_json::Value>,
) -> Result<Response<String>, Error> {
    let username = req.body()["username"].to_string();
    let password = req.body()["password"].to_string();

    Ok(standard_json_response(http::StatusCode::OK)
        .body("Foo".to_owned())
        .expect("Failed to build response"))
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let state = State::new().await;

    let handler_func_state = &state;
    let handler_func = move |req: Request, cxt: Context| async move {
        Ok(match *req.method() {
            Method::POST => match req.uri().path() {
                "/api/auth/signin" => handle_auth_signin(&state, req).await,
                _ => Response::builder()
                    .status(404)
                    .body("Not found")
                    .expect("Failed to render response"),
            },
            _ => Response::builder()
                .status(404)
                .body("Not found")
                .expect("Failed to render response"),
        })
    };

    lambda_runtime::run(handler(handler_func)).await?;
    Ok(())
}
