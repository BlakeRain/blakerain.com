use minijinja::{
    Environment, Error, ErrorKind,
    value::{Kwargs, Value},
};
use serde::{Deserialize, de::value::SeqDeserializer};
use time::{
    Date, OffsetDateTime, PrimitiveDateTime,
    format_description::{BorrowedFormatItem, well_known},
    macros::format_description,
};

pub fn add_filters(environment: &mut Environment) {
    environment.add_filter("concat", concat);
    environment.add_filter("date", date);
    environment.add_filter("datetime", datetime);
    environment.add_filter("substr", substr);
    environment.add_filter("take", take);
}

fn concat(value: &Value) -> Result<Value, Error> {
    let mut result = Vec::new();
    for item in value.try_iter()? {
        let item_iter = item.try_iter()?;
        result.extend(item_iter);
    }

    Ok(Value::from(result))
}

enum ParsedDate {
    Date(Date),
    DateTime(OffsetDateTime),
}

impl TryFrom<&Value> for ParsedDate {
    type Error = Error;

    fn try_from(value: &Value) -> Result<Self, Self::Error> {
        if let Some(value) = value.as_str() {
            if let Ok(datetime) = OffsetDateTime::parse(value, ISO_FORMAT) {
                Ok(ParsedDate::DateTime(datetime))
            } else if let Ok(datetime) = PrimitiveDateTime::parse(value, ISO_FORMAT) {
                Ok(ParsedDate::DateTime(datetime.assume_utc()))
            } else if let Ok(date) = Date::parse(value, ISO_DATE_FORMAT) {
                Ok(ParsedDate::Date(date))
            } else {
                tracing::error!(?value, "not a valid date or datetime");

                Err(Error::new(
                    ErrorKind::InvalidOperation,
                    "not a valid date or datetime",
                ))
            }
        } else {
            let mut items = Vec::new();
            for item in value.try_iter()? {
                items.push(i64::try_from(item)?);
            }

            let len = items.len();
            let seq = SeqDeserializer::new(items.into_iter());

            fn serde_error(err: serde::de::value::Error) -> Error {
                Error::new(ErrorKind::InvalidOperation, "Not a valid date or datetime").with_source(err)
            }

            if len == 2 {
                Ok(ParsedDate::Date(
                    Date::deserialize(seq).map_err(serde_error)?,
                ))
            } else if len == 6 {
                Ok(ParsedDate::DateTime(
                    PrimitiveDateTime::deserialize(seq)
                        .map_err(serde_error)?
                        .assume_utc(),
                ))
            } else {
                Ok(ParsedDate::DateTime(
                    OffsetDateTime::deserialize(seq).map_err(serde_error)?,
                ))
            }
        }
    }
}

const ISO_FORMAT: &[BorrowedFormatItem<'static>] = format_description!(
    version = 2,
    "[year]-[month]-[day]T[hour]:[minute]:[second][optional [[offset_hour sign:mandatory]:[offset_minute]]]"
);

const ISO_DATE_FORMAT: &[BorrowedFormatItem<'static>] = format_description!("[year]-[month]-[day]");

fn datetime(value: &Value, kwargs: Kwargs) -> Result<String, Error> {
    let ParsedDate::DateTime(datetime) = ParsedDate::try_from(value)? else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "expected a datetime (not a date)",
        ));
    };

    match kwargs.get::<Option<&str>>("format")? {
        None => datetime.format(ISO_FORMAT),
        Some(format) => {
            if format == "rfc2822" {
                datetime.format(&well_known::Rfc2822)
            } else if format == "rfc3339" {
                datetime.format(&well_known::Rfc3339)
            } else if format == "iso8601" {
                datetime.format(&well_known::Iso8601::DEFAULT)
            } else if format == "iso" {
                datetime.format(&ISO_FORMAT)
            } else if format == "iso-date" {
                datetime.format(&ISO_DATE_FORMAT)
            } else {
                let format = time::format_description::parse(format).map_err(|err| {
                    Error::new(ErrorKind::InvalidOperation, "invalid datetime format")
                        .with_source(err)
                })?;

                datetime.format(&format)
            }
        }
    }
    .map_err(|err| {
        Error::new(ErrorKind::InvalidOperation, "failed to format datetime").with_source(err)
    })
}

fn date(value: &Value, kwargs: Kwargs) -> Result<String, Error> {
    let date = match ParsedDate::try_from(value)? {
        ParsedDate::Date(date) => date,
        ParsedDate::DateTime(datetime) => datetime.date(),
    };

    match kwargs.get::<Option<&str>>("format")? {
        None => date.format(ISO_DATE_FORMAT),
        Some(format) => {
            if format == "rfc2822" {
                date.midnight().assume_utc().format(&well_known::Rfc2822)
            } else if format == "rfc3339" {
                date.midnight().assume_utc().format(&well_known::Rfc3339)
            } else if format == "iso8601" {
                date.midnight()
                    .assume_utc()
                    .format(&well_known::Iso8601::DEFAULT)
            } else if format == "iso" {
                date.midnight().assume_utc().format(&ISO_FORMAT)
            } else {
                let format = time::format_description::parse(format).map_err(|err| {
                    Error::new(ErrorKind::InvalidOperation, "invalid date format").with_source(err)
                })?;

                date.format(&format)
            }
        }
    }
    .map_err(|err| {
        Error::new(ErrorKind::InvalidOperation, "failed to format date").with_source(err)
    })
}

fn substr(value: String, kwargs: Kwargs) -> Result<String, Error> {
    let start = kwargs.get::<Option<usize>>("start")?.unwrap_or(0);
    let len = kwargs.get::<Option<usize>>("len")?;
    let end = kwargs.get::<Option<isize>>("end")?;

    if len.is_some() && end.is_some() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "cannot specify both len and end",
        ));
    }

    let end = end.map(|end| {
        if end < 0 {
            (value.len() as isize + end).max(0) as usize
        } else {
            end as usize
        }
    });

    let end = if let Some(len) = len {
        start + len
    } else if let Some(end) = end {
        end
    } else {
        value.len()
    };

    Ok(value.chars().skip(start).take(end - start).collect())
}

fn take(value: &Value, count: usize) -> Result<Value, Error> {
    let mut result = Vec::new();
    for item in value.try_iter()? {
        if result.len() >= count {
            break;
        }

        result.push(item);
    }

    Ok(Value::from(result))
}

