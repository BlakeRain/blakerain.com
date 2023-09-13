use analytics_model::user::User;
use async_trait::async_trait;
use fernet::Fernet;
use poem::{
    error::InternalServerError,
    http::StatusCode,
    web::headers::{self, authorization::Bearer, HeaderMapExt},
    Endpoint, Request,
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

pub struct AuthEndpoint<E: Endpoint> {
    pool: PgPool,
    fernet: Fernet,
    endpoint: E,
}

impl<E: Endpoint> AuthEndpoint<E> {
    pub fn new(pool: PgPool, fernet: Fernet, endpoint: E) -> Self {
        Self {
            pool,
            fernet,
            endpoint,
        }
    }
}

#[async_trait]
impl<E: Endpoint> Endpoint for AuthEndpoint<E> {
    type Output = E::Output;

    async fn call(&self, mut request: Request) -> poem::Result<Self::Output> {
        // Make sure that we have an 'Authorization' header that has a 'Bearer' token.
        let Some(auth) = request.headers().typed_get::<headers::Authorization<Bearer>>() else {
            log::info!("Missing 'Authorization' header with 'Bearer' token");
            return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
        };

        // Ensure that we can decrypt the token using the provided Fernet key.
        let Token { user_id } = match Token::decode(&self.fernet, auth.token()) {
            Some(token) => token,
            None => {
                log::error!("Failed to decode authentication token");
                return Err(poem::Error::from_status(StatusCode::UNAUTHORIZED));
            }
        };

        // If the user no longer exists, then a simple 401 will suffice.
        let Some(user) = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
            .bind(user_id).fetch_optional(&self.pool).await.map_err(InternalServerError)? else {
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
