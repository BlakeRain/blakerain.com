use gloo::net::http::Request;
use serde::Deserialize;

use crate::analytics::api::get_analytics_host;

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum SignInResponse {
    InvalidCredentials,
    NewPassword,
    Successful { token: String },
}

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum ValidateTokenResponse {
    Invalid,
    Valid { token: String },
}

pub async fn sign_in(username: &str, password: &str) -> Result<SignInResponse, &'static str> {
    let host = get_analytics_host();
    let res = Request::post(&format!("{host}auth/sign_in"))
        .json(&serde_json::json!({
            "username": username,
            "password": password
        }))
        .expect("JSON")
        .send()
        .await
        .map_err(|err| {
            log::error!("Failed to send authentication request: {err:?}");
            "Failed to send authentication request"
        })?;

    let res = res.json().await.map_err(|err| {
        log::error!("Unable to parse sign in response: {err:?}");
        "Unable to parse sign in response"
    })?;

    Ok(res)
}

pub async fn new_password(
    username: &str,
    old_password: &str,
    new_password: &str,
) -> Result<SignInResponse, &'static str> {
    let host = get_analytics_host();
    let res = Request::post(&format!("{host}auth/sign_in"))
        .json(&serde_json::json!({
            "username": username,
            "oldPassword": old_password,
            "newPassword": new_password
        }))
        .expect("JSON")
        .send()
        .await
        .map_err(|err| {
            log::error!("Failed to send authentication request: {err:?}");
            "Failed to send authentication request"
        })?;

    let res = res.json().await.map_err(|err| {
        log::error!("Unable to parse sign in response: {err:?}");
        "Unable to parse sign in response"
    })?;

    Ok(res)
}

pub async fn validate(token: &str) -> Result<ValidateTokenResponse, &'static str> {
    let host = get_analytics_host();
    let res = Request::post(&format!("{host}auth/validate"))
        .json(&serde_json::json!({
            "token": token
        }))
        .expect("JSON")
        .send()
        .await
        .map_err(|err| {
            log::error!("Failed to validate analytics authentication token: {err:?}");
            "Failed to validate analytics authentication token"
        })?;

    let res = res.json().await.map_err(|err| {
        log::error!("Unable to parse analytics token validation response: {err:?}");
        "Unable to parse analytics token validation response"
    })?;

    Ok(res)
}
