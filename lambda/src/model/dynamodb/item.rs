use std::collections::HashMap;

use aws_sdk_dynamodb::model::AttributeValue;
use thiserror::Error;

use super::attribute::AttributeError;

#[derive(Debug, Error)]
pub enum FromItemError {
    #[error("Missing attribute '{0}'")]
    MissingAttribute(String),
    #[error("Attribute error in '{0}': {1}")]
    AttributeError(String, AttributeError),
}

pub trait ToItem {
    fn to_item(self) -> HashMap<String, AttributeValue>;
}

pub trait FromItem: Sized {
    fn from_item(item: HashMap<String, AttributeValue>) -> Result<Self, FromItemError>;
}
