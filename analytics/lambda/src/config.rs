use std::io::Read;

use lambda_runtime::Error;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct Config {
    pub db: DbConfig,
    pub auth: AuthConfig,
}

#[derive(Debug, Deserialize)]
pub struct DbConfig {
    pub endpoint: String,
    pub port: Option<u16>,
    pub username: String,
    pub password: String,
    pub dbname: String,
}

#[derive(Debug, Deserialize)]
pub struct AuthConfig {
    pub token_key: String,
}

pub fn load_from_file() -> Result<Config, Error> {
    log::info!("Loading configuration from 'local.toml'");
    let path = std::env::current_dir()?.join("local.toml");
    if !path.is_file() {
        log::error!("Local configuration file 'local.toml' not found");
        return Err("Missing configuration file".into());
    }

    let mut file = std::fs::File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    let config = toml::from_str(&content)?;
    Ok(config)
}

pub async fn load_from_env() -> Result<Config, Error> {
    let endpoint = std::env::var("DATABASE_ENDPOINT")?;
    let password = std::env::var("DATABASE_PASSWORD")?;
    let token_key = std::env::var("TOKEN_KEY")?;

    let db = DbConfig {
        endpoint,
        port: None,
        username: "analytics".to_string(),
        password,
        dbname: "analytics".to_string(),
    };

    let auth = AuthConfig { token_key };

    Ok(Config { db, auth })
}
