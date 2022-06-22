use http::Response;
use lambda_http::{Body, Request, RequestExt};
use lambda_runtime::Error;
use serde::Deserialize;
use time::OffsetDateTime;

use crate::{
    env::Env,
    model::{
        dynamodb::{
            attribute::Attribute,
            item::{FromItem, ToItem},
        },
        page_view::PageView,
    },
};

use super::utils::{add_standard_headers, from_request};

pub async fn handle_page_view(env: &Env, request: &Request) -> Result<Response<Body>, Error> {
    let query = request.query_string_parameters();

    if let Some(page_view) = PageView::from_querystring(query) {
        if let Err(err) = env
            .ddb
            .put_item()
            .table_name(env.table_name.to_string())
            .set_item(Some(page_view.to_item()))
            .send()
            .await
        {
            println!("Failed to insert item: {:?}", err);
        }
    }

    Ok(
        add_standard_headers(Response::builder().status(202), "image/gif")
            .body(Body::Empty)
            .expect("Failed to build response"),
    )
}

#[derive(Deserialize)]
struct PageViewAppend {
    uuid: String,
    path: String,
    duration: u64,
    scroll: u64,
}

fn map_weekday(time: &OffsetDateTime) -> u8 {
    time.weekday().number_days_from_sunday()
}

async fn update_accumulators(
    env: &Env,
    path: &str,
    time: &OffsetDateTime,
    append: &PageViewAppend,
) -> Result<(), Error> {
    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", path.to_string().into_attr())
        .key(
            "Section",
            format!(
                "Day-{}-{:02}-{:02}T{:02}",
                time.year(),
                time.month() as u8,
                time.day(),
                time.hour()
            )
            .into_attr(),
        )
        .update_expression("ADD TotalDuration :du, TotalScroll :sc")
        .expression_attribute_values(":du", append.duration.into_attr())
        .expression_attribute_values(":sc", append.scroll.into_attr())
        .send()
        .await?;

    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", path.to_string().into_attr())
        .key(
            "Section",
            format!(
                "Week-{}-{:02}-{}",
                time.year(),
                time.iso_week(),
                map_weekday(&time)
            )
            .into_attr(),
        )
        .update_expression("ADD TotalDuration :du, TotalScroll :sc")
        .expression_attribute_values(":du", append.duration.into_attr())
        .expression_attribute_values(":sc", append.scroll.into_attr())
        .send()
        .await?;

    env.ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", path.to_string().into_attr())
        .key(
            "Section",
            format!(
                "Month-{}-{:02}-{:02}",
                time.year(),
                time.month() as u8,
                time.day()
            )
            .into_attr(),
        )
        .update_expression("ADD TotalDuration :du, TotalScroll :sc")
        .expression_attribute_values(":du", append.duration.into_attr())
        .expression_attribute_values(":sc", append.scroll.into_attr())
        .send()
        .await?;

    Ok(())
}

pub async fn handle_page_view_append(
    env: &Env,
    request: &Request,
) -> Result<Response<Body>, Error> {
    let append = from_request::<PageViewAppend>(request)?;

    let res = env
        .ddb
        .get_item()
        .table_name(env.table_name.to_string())
        .key("Path", append.path.clone().into_attr())
        .key("Section", format!("view-{}", append.uuid).into_attr())
        .send()
        .await?;
    if let Some(item) = res.item {
        let page_view = PageView::from_item(item)?;
        let time = page_view.time;

        // Update the pageView record with the duration and scroll information
        if let Err(err) = env
            .ddb
            .update_item()
            .table_name(env.table_name.to_string())
            .key("Path", append.path.clone().into_attr())
            .key("Section", format!("view-{}", append.uuid).into_attr())
            .update_expression("SET #DU = :d, #SC = :s")
            .expression_attribute_names("#DU", "Duration")
            .expression_attribute_names("#SC", "Scroll")
            .expression_attribute_values(":d", append.duration.into_attr())
            .expression_attribute_values(":s", append.scroll.into_attr())
            .send()
            .await
        {
            println!("Failed to update item: {:?}", err);
        }

        // Update the accumulated statistics for the page view path and the site overall
        update_accumulators(env, &append.path, &time, &append).await?;
        update_accumulators(env, "site", &time, &append).await?;
    } else {
        println!(
            "Ignoring append for page view '{}' (of '{}') that does not exist",
            append.uuid, append.path
        );
    }

    Ok(
        add_standard_headers(Response::builder().status(200), "application/json")
            .body(Body::Text("{}".to_string()))
            .expect("Failed to build response"),
    )
}
