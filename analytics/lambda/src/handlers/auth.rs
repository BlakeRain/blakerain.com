use analytics_model::user::{authenticate, reset_password};
use poem::{
    error::InternalServerError,
    handler,
    web::{Data, Json},
};
use serde::{Deserialize, Serialize};

use crate::{endpoints::auth::Token, env::Env};

#[derive(Deserialize)]
pub struct SignInBody {
    username: String,
    password: String,
}

#[derive(Serialize)]
#[serde(tag = "type")]
pub enum SignInResponse {
    InvalidCredentials,
    NewPassword,
    Successful { token: String },
}

#[derive(Deserialize)]
pub struct NewPasswordBody {
    username: String,
    #[serde(rename = "oldPassword")]
    old_password: String,
    #[serde(rename = "newPassword")]
    new_password: String,
}

#[handler]
pub async fn signin(
    env: Data<&Env>,
    Json(SignInBody { username, password }): Json<SignInBody>,
) -> poem::Result<Json<SignInResponse>> {
    let Some(user) = authenticate(&env.pool, &username, &password).await.map_err(InternalServerError)? else {
        return Ok(Json(SignInResponse::InvalidCredentials));
    };

    if user.reset_password {
        return Ok(Json(SignInResponse::NewPassword));
    }

    let token = Token::new(user.id);
    let token = token.encode(&env.fernet);
    Ok(Json(SignInResponse::Successful { token }))
}

#[handler]
pub async fn new_password(
    env: Data<&Env>,
    Json(NewPasswordBody {
        username,
        old_password,
        new_password,
    }): Json<NewPasswordBody>,
) -> poem::Result<Json<SignInResponse>> {
    let Some(user) = authenticate(&env.pool, &username, &old_password).await.map_err(InternalServerError)? else {
        return Ok(Json(SignInResponse::InvalidCredentials));
    };

    let Some(user) = reset_password(&env.pool, user.id, new_password).await.map_err(InternalServerError)? else {
        return Ok(Json(SignInResponse::InvalidCredentials));
    };

    let token = Token::new(user.id);
    let token = token.encode(&env.fernet);
    Ok(Json(SignInResponse::Successful { token }))
}
