use std::{
    collections::HashMap,
    io::{BufRead, BufReader},
    path::Path,
};

use anyhow::Context;
use nom::{
    IResult, Parser,
    branch::alt,
    bytes::complete::{escaped_transform, tag},
    character::complete::{alpha1, alphanumeric1, char, digit1, multispace0, none_of},
    combinator::{opt, recognize, value},
    error::ParseError,
    multi::{many0_count, separated_list0},
    sequence::{delimited, pair, preceded},
};
use serde::Serialize;

use crate::parsing::frontmatter::parse_frontmatter;

pub fn load_frontmatter_and_source<P: AsRef<Path>>(
    path: P,
) -> anyhow::Result<(serde_json::Value, Vec<String>)> {
    let source = BufReader::new(std::fs::File::open(path).context("failed to open source file")?)
        .lines()
        .collect::<Result<Vec<_>, _>>()
        .context("failed to read source file")?;

    let nlines = source.len();
    let (frontmatter, source) = parse_frontmatter(source).context("failed to parse frontmatter")?;

    let source = if source.len() < nlines {
        std::iter::repeat_n(String::new(), nlines - source.len())
            .chain(source)
            .collect::<Vec<_>>()
    } else {
        source
    };

    Ok((frontmatter, source))
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct CodeBlockSpec {
    pub language: Option<String>,
    pub attributes: HashMap<String, AttributeValue>,
}

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(untagged)]
pub enum AttributeValue {
    Ident(String),
    Number(f64),
    String(String),
}

impl AttributeValue {
    pub fn as_str(&self) -> Option<&str> {
        match self {
            Self::Ident(value) => Some(value.as_str()),
            Self::Number(_) => None,
            Self::String(value) => Some(value.as_str()),
        }
    }
}

fn ws<'a, O, E, F>(inner: F) -> impl Parser<&'a str, Output = O, Error = E>
where
    E: ParseError<&'a str>,
    F: Parser<&'a str, Output = O, Error = E>,
{
    delimited(multispace0, inner, multispace0)
}

fn identifier(input: &str) -> IResult<&str, String> {
    recognize(pair(
        alt((alpha1, tag("_"))),
        many0_count(alt((alphanumeric1, tag("-"), tag("_")))),
    ))
    .parse(input)
    .map(|(input, result)| (input, String::from(result)))
}

fn number(input: &str) -> IResult<&str, f64> {
    let (input, integer) = digit1(input)?;
    let (input, maybe_dot) = opt((char('.'), digit1)).parse(input)?;

    let result = if let Some((_, digits)) = maybe_dot {
        format!("{integer}.{digits}")
    } else {
        integer.to_string()
    };

    Ok((input, result.parse().expect("number")))
}

fn string(input: &str) -> IResult<&str, String> {
    let normal_char = none_of("\\\"");
    let escape_seq = preceded(
        char('\\'),
        alt((
            value('"', char('"')),
            value('\\', char('\\')),
            value('\n', char('\n')),
            value('\r', char('\r')),
            value('\t', char('\t')),
        )),
    );

    delimited(
        char('"'),
        escaped_transform(normal_char, '\\', escape_seq),
        char('"'),
    )
    .parse(input)
}

fn attribute(input: &str) -> IResult<&str, (String, AttributeValue)> {
    let (input, name) = ws(identifier).parse(input)?;
    let (input, _) = ws(char('=')).parse(input)?;
    let (input, value) = ws(alt((
        string.map(AttributeValue::String),
        number.map(AttributeValue::Number),
        identifier.map(AttributeValue::Ident),
    )))
    .parse(input)?;

    Ok((input, (name, value)))
}

fn attribute_list(input: &str) -> IResult<&str, HashMap<String, AttributeValue>> {
    let (input, elements) = separated_list0(ws(char(',')), attribute).parse(input)?;
    Ok((input, elements.into_iter().collect()))
}

impl CodeBlockSpec {
    pub fn parse(input: &str) -> IResult<&str, Self> {
        let (input, language) = opt(ws(identifier)).parse(input)?;
        let (input, attributes) =
            opt(delimited(ws(char('{')), attribute_list, ws(char('}')))).parse(input)?;

        Ok((
            input,
            Self {
                language,
                attributes: attributes.unwrap_or_default(),
            },
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_code_block_spec() {
        assert_eq!(
            CodeBlockSpec::parse("plain").expect("parse to succeed"),
            (
                "",
                CodeBlockSpec {
                    language: Some(String::from("plain")),
                    attributes: HashMap::new(),
                }
            )
        );

        assert_eq!(
            CodeBlockSpec::parse("plain {class=text-wrap}").expect("parse to succeed"),
            (
                "",
                CodeBlockSpec {
                    language: Some(String::from("plain")),
                    attributes: HashMap::from_iter([(
                        String::from("class"),
                        AttributeValue::Ident(String::from("text-wrap"))
                    )])
                }
            )
        );

        assert_eq!(
            CodeBlockSpec::parse("plain {class=\"text-wrap\"}").expect("parse to succeed"),
            (
                "",
                CodeBlockSpec {
                    language: Some(String::from("plain")),
                    attributes: HashMap::from_iter([(
                        String::from("class"),
                        AttributeValue::String(String::from("text-wrap"))
                    )])
                }
            )
        );

        assert_eq!(
            CodeBlockSpec::parse("plain {class=\"text-wrap\", title=\"longer title\"}")
                .expect("parse to succeed"),
            (
                "",
                CodeBlockSpec {
                    language: Some(String::from("plain")),
                    attributes: HashMap::from_iter([
                        (
                            String::from("class"),
                            AttributeValue::String(String::from("text-wrap"))
                        ),
                        (
                            String::from("title"),
                            AttributeValue::String(String::from("longer title"))
                        ),
                    ]),
                }
            )
        );
    }
}
