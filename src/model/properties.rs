use std::{collections::HashMap, str::FromStr};
use thiserror::Error;

use nom::{
    branch::alt,
    bytes::complete::{is_not, tag},
    character::complete::{alpha1, alphanumeric1, multispace0},
    combinator::{opt, recognize},
    multi::many0_count,
    sequence::{delimited, pair, preceded},
    IResult,
};

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Properties {
    properties: HashMap<String, Option<String>>,
}

#[derive(Debug, Error)]
pub enum PropertiesParseError {
    #[error("Unable to parse identifier: {0}")]
    InvalidIdentifier(nom::Err<nom::error::Error<String>>),
    #[error("Unable to parse value: {0}")]
    InvalidValue(nom::Err<nom::error::Error<String>>),
}

impl PropertiesParseError {
    fn invalid_identifier(err: nom::Err<nom::error::Error<&str>>) -> Self {
        Self::InvalidIdentifier(err.to_owned())
    }

    fn invalid_value(err: nom::Err<nom::error::Error<&str>>) -> Self {
        Self::InvalidValue(err.to_owned())
    }
}

impl FromStr for Properties {
    type Err = PropertiesParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        let mut input = s;
        let mut properties = HashMap::new();

        while !input.is_empty() {
            let (rest, name): (&str, &str) = preceded(multispace0, identifier)(input)
                .map_err(PropertiesParseError::invalid_identifier)?;

            let (rest, value) = opt(preceded(tag("="), alt((identifier, string_literal))))(rest)
                .map_err(PropertiesParseError::invalid_value)?;

            properties.insert(name.to_string(), value.map(ToString::to_string));
            input = rest;
        }

        Ok(Self { properties })
    }
}

fn identifier(input: &str) -> IResult<&str, &str> {
    recognize(pair(
        alt((alpha1, tag("_"))),
        many0_count(alt((alphanumeric1, tag("_")))),
    ))(input)
}

fn string_literal(input: &str) -> IResult<&str, &str> {
    delimited(tag("\""), is_not("\"\\"), tag("\""))(input)
}

impl Properties {
    pub fn has(&self, name: &str) -> bool {
        self.properties.contains_key(name)
    }

    pub fn get(&self, name: &str) -> Option<&str> {
        if let Some(value) = self.properties.get(name) {
            if let Some(value) = value.as_deref() {
                return Some(value);
            }
        }

        None
    }
}
