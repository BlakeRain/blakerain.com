use std::collections::HashMap;

use model::properties::Properties;
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

pub fn parse_properties(s: &str) -> Result<Properties, PropertiesParseError> {
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

    Ok(Properties::from(properties))
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

pub fn parse_language_properties(
    input: &str,
) -> Result<(String, Properties), PropertiesParseError> {
    let input = input.trim();
    if let Some((language, rest)) = input.split_once(' ') {
        let rest = rest.trim();
        let properties = if rest.is_empty() {
            Properties::default()
        } else {
            parse_properties(rest)?
        };

        Ok((language.to_string(), properties))
    } else {
        Ok((input.to_string(), Properties::default()))
    }
}

pub fn parse_language(input: &str) -> String {
    let input = input.trim();
    if let Some((language, _)) = input.split_once(' ') {
        language.to_string()
    } else {
        input.to_string()
    }
}
