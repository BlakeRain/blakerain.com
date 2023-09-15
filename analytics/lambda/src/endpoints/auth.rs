use analytics_model::user::User;
use async_trait::async_trait;
use fernet::Fernet;
use poem::{
    error::InternalServerError,
    http::StatusCode,
    web::headers::{self, authorization::Bearer, HeaderMapExt},
    Endpoint, Middleware, Request,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::env::Env;

pub struct AuthContext {
    skip_prefixes: Vec<String>,
    env: Env,
}

impl AuthContext {
    pub fn new(skip_prefixes: &[&str], env: Env) -> Self {
        Self {
            skip_prefixes: skip_prefixes.iter().map(ToString::to_string).collect(),
            env,
        }
    }
}

impl<E: Endpoint> Middleware<E> for AuthContext {
    type Output = AuthEndpoint<E>;

    fn transform(&self, ep: E) -> Self::Output {
        AuthEndpoint::new(self.skip_prefixes.clone(), self.env.clone(), ep)
    }
}

pub struct AuthEndpoint<E: Endpoint> {
    skip_prefixes: Vec<String>,
    env: Env,
    endpoint: E,
}

impl<E: Endpoint> AuthEndpoint<E> {
    fn new(skip_prefixes: Vec<String>, env: Env, endpoint: E) -> Self {
        Self {
            skip_prefixes,
            env,
            endpoint,
        }
    }
}

#[async_trait]
impl<E: Endpoint> Endpoint for AuthEndpoint<E> {
    type Output = E::Output;

    async fn call(&self, mut request: Request) -> poem::Result<Self::Output> {
        for skip_prefix in &self.skip_prefixes {
            if request.uri().path().starts_with(skip_prefix) {
                return self.endpoint.call(request).await;
            }
        }

        // Make sure that we have an 'Authorization' header that has a 'Bearer' token.
        let Some(auth) = request.headers().typed_get::<headers::Authorization<Bearer>>() else {
            log::info!("Missing 'Authorization' header with 'Bearer' token");
            return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
        };

        // Ensure that we can decrypt the token using the provided Fernet key.
        let Token { user_id } = match Token::decode(&self.env.fernet, auth.token()) {
            Some(token) => token,
            None => {
                log::error!("Failed to decode authentication token");
                return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
            }
        };

        // If the user no longer exists, then a simple 401 will suffice.
        let Some(user) = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(user_id).fetch_optional(&self.env.pool).await.map_err(InternalServerError)? else {
            log::error!("User '{user_id}' no longer exists");
            return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
        };

        // Make sure that the user is still enabled.
        if !user.enabled {
            log::error!("User '{user_id}' is not enabled");
            return Err(poem::Error::from_status(StatusCode::FORBIDDEN));
        }

        // Store the authenticated user in the request for retrieval by handlers.
        request.set_data(user);

        self.endpoint.call(request).await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Token {
    pub user_id: Uuid,
}

impl Token {
    pub fn new(user_id: Uuid) -> Self {
        Self { user_id }
    }

    pub fn encode(&self, fernet: &Fernet) -> String {
        let plain = serde_json::to_string(self).expect("Unable to JSON encode token");
        fernet.encrypt(plain.as_bytes())
    }

    pub fn decode(fernet: &Fernet, encoded: &str) -> Option<Self> {
        let plain = fernet.decrypt(encoded).ok()?;
        serde_json::from_slice(&plain).ok()
    }
}
