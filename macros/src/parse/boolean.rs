use thiserror::Error;

#[derive(Debug, Error)]
pub enum BooleanParseError {
    #[error("Unable to parse boolean value: {0}")]
    InvalidValue(String),
}

pub fn parse_boolean(value: &str) -> Result<bool, BooleanParseError> {
    let lower = value.trim().to_lowercase();
    match lower.as_str() {
        "false" => Ok(false),
        "true" => Ok(true),
        "0" => Ok(false),
        "1" => Ok(true),
        "no" => Ok(false),
        "yes" => Ok(true),
        _ => Err(BooleanParseError::InvalidValue(value.to_string())),
    }
}
