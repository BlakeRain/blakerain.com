use std::path::Path;

use anyhow::Context;
use serde_json::{Map, Value};
use time::{PrimitiveDateTime, UtcOffset};

pub fn load_toml<P: AsRef<Path>>(path: P) -> anyhow::Result<Value> {
    let path = path.as_ref();

    if !path.is_file() {
        return Err(anyhow::anyhow!("TOML file not found at {:?}", path));
    }

    let contents = std::fs::read_to_string(&path).context("failed to read TOML file")?;
    parse_toml(&contents)
}

pub fn parse_toml(src: &str) -> anyhow::Result<Value> {
    let value = toml::from_str(src).context("failed to parse TOML")?;
    toml_to_json(value)
}

fn toml_to_json(value: toml::Value) -> anyhow::Result<Value> {
    match value {
        toml::Value::String(string) => Ok(Value::String(string)),
        toml::Value::Integer(integer) => Ok(Value::Number(integer.into())),
        toml::Value::Float(float) => Ok(Value::Number(
            serde_json::Number::from_f64(float).context("cannot represent float")?,
        )),
        toml::Value::Boolean(boolean) => Ok(Value::Bool(boolean)),
        toml::Value::Datetime(toml::value::Datetime { date, time, offset }) => {
            let Some(toml::value::Date { year, month, day }) = date else {
                anyhow::bail!("datetime had no date");
            };

            let date = time::Date::from_calendar_date(
                year as i32,
                time::Month::try_from(month).context("invalid month")?,
                day,
            )
            .context("invalid calendar date")?;

            let time = if let Some(toml::value::Time {
                hour,
                minute,
                second,
                nanosecond,
            }) = time
            {
                time::Time::from_hms_nano(
                    hour,
                    minute,
                    second.unwrap_or(0),
                    nanosecond.unwrap_or(0),
                )
                .context("invalid time")?
            } else {
                time::Time::MIDNIGHT
            };

            let time = PrimitiveDateTime::new(date, time);
            let offset = if let Some(toml::value::Offset::Custom { minutes }) = offset {
                UtcOffset::from_whole_seconds(60 * minutes as i32).context("invalid time offset")?
            } else {
                UtcOffset::UTC
            };

            serde_json::to_value(time.assume_offset(offset)).context("failed to serialize datetime")
        }

        toml::Value::Array(array) => Ok(Value::Array(
            array
                .into_iter()
                .map(toml_to_json)
                .collect::<anyhow::Result<Vec<Value>>>()?,
        )),

        toml::Value::Table(table) => Ok(Value::Object({
            let mut object = Map::new();

            for (key, value) in table {
                object.insert(key, toml_to_json(value)?);
            }

            object
        })),
    }
}
