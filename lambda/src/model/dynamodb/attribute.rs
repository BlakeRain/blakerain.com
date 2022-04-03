use std::collections::HashMap;

use aws_sdk_dynamodb::model::AttributeValue;
use thiserror::Error;
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

use super::item::FromItemError;

#[derive(Debug, Error)]
pub enum AttributeError {
    #[error("Incorrect attribute type")]
    IncorrectType,
    #[error("Parse error: {0}")]
    ParseError(String),
}

pub trait Attribute: Sized {
    fn into_attr(self) -> AttributeValue;
    fn from_attr(value: AttributeValue) -> Result<Self, AttributeError>;
}

impl Attribute for String {
    fn into_attr(self) -> AttributeValue {
        AttributeValue::S(self)
    }

    fn from_attr(value: AttributeValue) -> Result<Self, AttributeError> {
        match value {
            AttributeValue::S(value) => Ok(value),
            _ => Err(AttributeError::IncorrectType),
        }
    }
}

impl Attribute for i32 {
    fn into_attr(self) -> AttributeValue {
        AttributeValue::N(self.to_string())
    }

    fn from_attr(value: AttributeValue) -> Result<Self, AttributeError> {
        match value {
            AttributeValue::N(value) => {
                value
                    .parse()
                    .map_err(|err: <i32 as std::str::FromStr>::Err| {
                        AttributeError::ParseError(err.to_string())
                    })
            }
            _ => Err(AttributeError::IncorrectType),
        }
    }
}

impl Attribute for OffsetDateTime {
    fn into_attr(self) -> AttributeValue {
        AttributeValue::S(self.format(&Rfc3339).unwrap())
    }

    fn from_attr(value: AttributeValue) -> Result<OffsetDateTime, AttributeError> {
        value
            .as_s()
            .map_err(|_| AttributeError::IncorrectType)
            .and_then(|v| {
                OffsetDateTime::parse(v, &Rfc3339)
                    .map_err(|err| AttributeError::ParseError(err.to_string()))
            })
    }
}

impl<T: Attribute> Attribute for Option<T> {
    fn into_attr(self) -> AttributeValue {
        match self {
            None => AttributeValue::Null(true),
            Some(value) => value.into_attr(),
        }
    }

    fn from_attr(value: AttributeValue) -> Result<Self, AttributeError> {
        match value.as_null() {
            Ok(true) => Ok(None),
            _ => Ok(Some(Attribute::from_attr(value)?)),
        }
    }
}

pub fn get_attr<T: Attribute>(
    item: &mut HashMap<String, AttributeValue>,
    name: &str,
) -> Result<T, FromItemError> {
    match item.remove(name) {
        None => Err(FromItemError::MissingAttribute(name.to_string())),
        Some(attr) => {
            T::from_attr(attr).map_err(|err| FromItemError::AttributeError(name.to_string(), err))
        }
    }
}

pub fn get_attr_opt<T: Attribute>(
    item: &mut HashMap<String, AttributeValue>,
    name: &str,
) -> Result<Option<T>, FromItemError> {
    match item.remove(name) {
        None => Ok(None),
        Some(attr) => {
            Ok(Some(T::from_attr(attr).map_err(|err| {
                FromItemError::AttributeError(name.to_string(), err)
            })?))
        }
    }
}
