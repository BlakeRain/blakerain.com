use http::Response;
use lambda_http::{Body, Request};
use lambda_runtime::Error;
use pbkdf2::{
    password_hash::{PasswordHash, PasswordVerifier},
    Pbkdf2,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{env::Env, model::dynamodb::attribute::Attribute};

use super::utils::{add_standard_headers, from_request};

#[derive(Serialize, Deserialize)]
struct SignInBody {
    username: String,
    password: String,
}

pub async fn handle_auth_signin(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    // Parse the sign in data from the request body
    let body = from_request::<SignInBody>(request)?;

    // Query the database for the username
    let res = env
        .ddb
        .get_item()
        .table_name(env.table_name.to_owned())
        .key("Path", "user".to_owned().into_attr())
        .key("Section", body.username.clone().into_attr())
        .send()
        .await?;

    if let Some(res) = res.item {
        let password = String::from_attr(res["Password"].clone())?;
        let parsed_hash =
            PasswordHash::new(&password).map_err(|_| "Failed to parse password hash")?;
        let matches = Pbkdf2
            .verify_password(body.password.as_bytes(), &parsed_hash)
            .is_ok();

        let body = if matches {
            json!({
                "token": env.auth_key.encrypt(serde_json::to_string(&json!({
                    "username": body.username
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
        let body = json!({
            "error": "Invalid username or password"
        });

        Ok(
            add_standard_headers(Response::builder(), "application/json")
                .status(403)
                .body(
                    serde_json::to_string(&body)
                        .expect("Unable to serialize JSON")
                        .into(),
                )
                .expect("Unable to build response"),
        )
    }
}
