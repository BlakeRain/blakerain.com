use pbkdf2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Pbkdf2,
};
use rand_core::OsRng;
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    #[serde(skip)]
    pub password: String,
    pub enabled: bool,
    pub reset_password: bool,
}

pub async fn authenticate(
    pool: &PgPool,
    username: &str,
    password: &str,
) -> sqlx::Result<Option<User>> {
    let user: User = if let Some(user) = sqlx::query_as("SELECT * FROM users WHERE username = $1")
        .bind(username)
        .fetch_optional(pool)
        .await?
    {
        user
    } else {
        log::warn!("User not found with username '{username}'");
        return Ok(None);
    };

    let parsed_hash = PasswordHash::new(&user.password).expect("valid password hash");
    if let Err(err) = Pbkdf2.verify_password(password.as_bytes(), &parsed_hash) {
        log::error!(
            "Incorrect password for user '{username}' ('{}'): {err:?}",
            user.id
        );

        return Ok(None);
    }

    if !user.enabled {
        log::error!("User '{username}' ('{}') is disabled", user.id);
        return Ok(None);
    }

    Ok(Some(user))
}

pub async fn reset_password(
    pool: &PgPool,
    id: Uuid,
    new_password: String,
) -> sqlx::Result<Option<User>> {
    let salt = SaltString::generate(&mut OsRng);
    let password = Pbkdf2
        .hash_password(new_password.as_bytes(), &salt)
        .expect("valid password hash")
        .to_string();

    sqlx::query_as(
        "UPDATE users SET password = $1, reset_password = FALSE WHERE id = $2 RETURNING *",
    )
    .bind(password)
    .bind(id)
    .fetch_optional(pool)
    .await
}
