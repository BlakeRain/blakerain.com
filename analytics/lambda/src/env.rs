use std::ops::Deref;
use std::sync::Arc;
use std::time::Duration;

use fernet::Fernet;
use log::LevelFilter;
use sqlx::postgres::PgConnectOptions;
use sqlx::ConnectOptions;

use crate::config::Config;

pub struct Env {
    inner: Arc<Inner>,
}

impl Clone for Env {
    fn clone(&self) -> Self {
        Self {
            inner: Arc::clone(&self.inner),
        }
    }
}

impl Deref for Env {
    type Target = Inner;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

pub struct Inner {
    pub pool: sqlx::PgPool,
    pub fernet: Fernet,
}

impl Env {
    pub async fn new(config: Config) -> Self {
        let mut connection_opts = PgConnectOptions::new()
            .host(&config.db.endpoint)
            .username(&config.db.username)
            .password(&config.db.password)
            .database(&config.db.dbname)
            .log_statements(LevelFilter::Debug)
            .log_slow_statements(LevelFilter::Warn, Duration::from_secs(1));

        if let Some(port) = config.db.port {
            connection_opts = connection_opts.port(port);
        }

        let inner = Inner {
            pool: sqlx::PgPool::connect_with(connection_opts).await.unwrap(),
            fernet: Fernet::new(&config.auth.token_key).expect("valid fernet key"),
        };

        Self {
            inner: Arc::new(inner),
        }
    }
}
