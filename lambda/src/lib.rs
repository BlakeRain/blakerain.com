use aws_sdk_dynamodb::model::AttributeValue;
use fernet::Fernet;
use lambda_runtime::Error;

pub struct Env {
    pub auth_key: Fernet,
    pub table_name: String,
    pub ddb: aws_sdk_dynamodb::Client,
}

impl Env {
    pub async fn new() -> Self {
        let key = match std::env::var("AUTH_KEY").ok() {
            Some(key) => key,
            None => Fernet::generate_key(),
        };

        let cfg = aws_config::load_from_env().await;

        Env {
            auth_key: Fernet::new(&key).expect("Unable to generate Fernet key"),
            table_name: std::env::var("TABLE_NAME")
                .ok()
                .unwrap_or_else(|| "analytics".to_owned()),
            ddb: aws_sdk_dynamodb::Client::new(&cfg),
        }
    }

    pub async fn validate_token(&self, token: &str) -> Result<bool, Error> {
        let username = serde_json::from_str::<serde_json::Value>(std::str::from_utf8(
            &self.auth_key.decrypt(token)?,
        )?)?["username"]
            .as_str()
            .expect("Convert to string")
            .to_string();

        let res = self
            .ddb
            .get_item()
            .table_name(self.table_name.to_owned())
            .key("Path", AttributeValue::S("user".to_owned()))
            .key("Section", AttributeValue::S(username))
            .send()
            .await?;

        Ok(res.item().is_some())
    }
}
