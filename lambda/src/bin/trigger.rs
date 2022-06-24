use aws_sdk_dynamodb::model::AttributeValue;
use blakerain_analytics_lambdas::{env::Env, model::dynamodb::attribute::Attribute};
use lambda_runtime::{handler_fn, Context, Error};
use serde_json::Value;
use time::{format_description::well_known::Rfc3339, OffsetDateTime};

fn map_weekday(time: &OffsetDateTime) -> u8 {
    time.weekday().number_days_from_sunday()
}

async fn update_page_count(env: &Env, path: &str, time: &OffsetDateTime) -> Result<(), Error> {
    // Store the total views for this path on this day
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key(
            "Path",
            format!(
                "page-view-day-{}-{:02}-{:02}",
                time.year(),
                time.month() as u8,
                time.day()
            )
            .into_attr(),
        )
        .key("Section", path.to_string().into_attr())
        .update_expression("ADD ViewCount :n")
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    // Store the total views for this path in this week
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key(
            "Path",
            format!("page-view-week-{}-{:02}", time.year(), time.iso_week()).into_attr(),
        )
        .key("Section", path.to_string().into_attr())
        .update_expression("ADD ViewCount :n")
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    // Store the total views for this path in this month
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key(
            "Path",
            format!("page-view-month-{}-{:02}", time.year(), time.month() as u8).into_attr(),
        )
        .key("Section", path.to_string().into_attr())
        .update_expression("ADD ViewCount :n")
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    Ok(())
}

async fn update_path(env: &Env, path: &str, time: &OffsetDateTime) -> Result<(), Error> {
    // Store the "day" count for this page
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", AttributeValue::S(path.to_string()))
        .key(
            "Section",
            AttributeValue::S(format!(
                "Day-{}-{:02}-{:02}T{:02}",
                time.year(),
                time.month() as u8,
                time.day(),
                time.hour()
            )),
        )
        .update_expression("SET ViewDay = :d, ViewHour = :h ADD ViewCount :n")
        .expression_attribute_values(
            ":d",
            AttributeValue::S(
                format!(
                    "{}-{:02}-{:02}",
                    time.year(),
                    time.month() as u8,
                    time.day()
                )
                .to_string(),
            ),
        )
        .expression_attribute_values(":h", AttributeValue::S(time.hour().to_string()))
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    // Store the "week" count for this page
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", AttributeValue::S(path.to_string()))
        .key(
            "Section",
            AttributeValue::S(format!(
                "Week-{}-{:02}-{}",
                time.year(),
                time.iso_week(),
                map_weekday(time)
            )),
        )
        .update_expression("SET ViewWeek = :w, ViewDay = :d ADD ViewCount :n")
        .expression_attribute_values(
            ":w",
            AttributeValue::S(format!("{}-{:02}", time.year(), time.iso_week()).to_string()),
        )
        .expression_attribute_values(":d", AttributeValue::S(map_weekday(time).to_string()))
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    // Store the "month" count for this page
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", AttributeValue::S(path.to_string()))
        .key(
            "Section",
            AttributeValue::S(format!(
                "Month-{}-{:02}-{:02}",
                time.year(),
                time.month() as u8,
                time.day()
            )),
        )
        .update_expression("SET ViewMonth = :m, ViewDay = :d ADD ViewCount :n")
        .expression_attribute_values(
            ":m",
            AttributeValue::S(format!("{}-{:02}", time.year(), time.month() as u8).to_string()),
        )
        .expression_attribute_values(":d", AttributeValue::S(time.day().to_string()))
        .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
        .send()
        .await?;

    Ok(())
}

async fn update_user_agent(env: &Env, time: &OffsetDateTime, ua: &str) -> Result<(), Error> {
    let ua_parser = woothee::parser::Parser::new();

    if let Some(ua) = ua_parser.parse(ua) {
        let ua_name = ua.name.replace(" ", "-");

        env.ddb
            .update_item()
            .table_name(env.table_name.to_string())
            .key("Path", AttributeValue::S("browser".to_string()))
            .key(
                "Section",
                AttributeValue::S(format!(
                    "Week-{}-{:02}-{}#{}",
                    time.year(),
                    time.iso_week(),
                    map_weekday(time),
                    ua_name
                )),
            )
            .update_expression("SET ViewWeek = :w, ViewDay = :d ADD ViewCount :n")
            .expression_attribute_values(
                ":w",
                AttributeValue::S(format!("{}-{:02}", time.year(), time.iso_week())),
            )
            .expression_attribute_values(":d", AttributeValue::S(map_weekday(time).to_string()))
            .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
            .send()
            .await?;

        env.ddb
            .update_item()
            .table_name(env.table_name.to_string())
            .key("Path", AttributeValue::S("browser".to_string()))
            .key(
                "Section",
                AttributeValue::S(format!(
                    "Month-{}-{:02}-{:02}#{}",
                    time.year(),
                    time.month() as u8,
                    time.day(),
                    ua_name
                )),
            )
            .update_expression("SET ViewMonth = :m, ViewDay = :d ADD ViewCount :n")
            .expression_attribute_values(
                ":m",
                AttributeValue::S(format!("{}-{:02}", time.year(), time.month() as u8)),
            )
            .expression_attribute_values(":d", AttributeValue::S(time.day().to_string()))
            .expression_attribute_values(":n", AttributeValue::N("1".to_string()))
            .send()
            .await?;
    } else {
        println!("Could not parse user agent string: '{}'", ua);
    }

    Ok(())
}

async fn trigger_handler(env: &Env, event: Value) -> Result<(), Error> {
    if let Some(records) = event.get("Records").and_then(|v| v.as_array()) {
        for record in records {
            match record.get("eventName").and_then(|v| v.as_str()) {
                Some(event_name) if event_name == "INSERT" => {
                    if let Some(dynamo) = record.get("dynamodb") {
                        let fallback = serde_json::Map::new();
                        let keys = dynamo
                            .get("Keys")
                            .and_then(|v| v.as_object())
                            .unwrap_or(&fallback);
                        match (
                            keys.get("Path")
                                .and_then(|v| v.get("S"))
                                .and_then(|v| v.as_str()),
                            keys.get("Section")
                                .and_then(|v| v.get("S"))
                                .and_then(|v| v.as_str()),
                        ) {
                            (Some(path), Some(section)) => {
                                let path = if path.starts_with('/') {
                                    path.to_string()
                                } else {
                                    format!("/{}", path)
                                };

                                if section.starts_with("view-") {
                                    if let Some(image) =
                                        dynamo.get("NewImage").and_then(|v| v.as_object())
                                    {
                                        let time = OffsetDateTime::parse(
                                            image
                                                .get("Time")
                                                .ok_or("image has no 'Time' attribute")?
                                                .get("S")
                                                .ok_or(
                                                    "image 'Time' attribute has no 'S' attribute",
                                                )?
                                                .as_str()
                                                .ok_or(
                                                    "cannot convert 'Time' attribute to string",
                                                )?,
                                            &Rfc3339,
                                        )?;

                                        update_page_count(env, &path, &time).await?;
                                        update_path(env, &path, &time).await?;
                                        update_path(env, "site", &time).await?;

                                        if let Some(ua) = image
                                            .get("UserAgent")
                                            .and_then(|v| v.get("S"))
                                            .and_then(|v| v.as_str())
                                        {
                                            update_user_agent(env, &time, ua).await?;
                                        } else {
                                            println!(
                                                "No user agent specified in analytics request"
                                            );
                                        }
                                    } else {
                                        println!("No 'NewImage' specified in DynamoDB event");
                                    }
                                }
                            }
                            _ => {
                                println!("DynamoDB event missing 'Path' and/or 'Section' keys");
                            }
                        }
                    } else {
                        println!("INSERT event is missing 'dynamodb' section");
                    }
                }
                Some(_) => {
                    // Ignoring this event
                }
                _ => {
                    println!("No 'eventName' in event");
                }
            }
        }
    } else {
        println!("No 'Records' field, or field is not an array");
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let env = Env::new().await;

    let handler_env = &env;
    let handler =
        move |event: Value, _: Context| async move { trigger_handler(handler_env, event).await };

    lambda_runtime::run(handler_fn(handler)).await?;
    Ok(())
}
