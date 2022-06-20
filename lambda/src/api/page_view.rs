use http::Response;
use lambda_http::{Body, Request, RequestExt};
use lambda_runtime::Error;
use serde::Deserialize;

use crate::{
    env::Env,
    model::{
        dynamodb::{attribute::Attribute, item::ToItem},
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
    duration: i32,
    scroll: i32,
}

pub async fn handle_page_view_append(
    env: &Env,
    request: &Request,
) -> Result<Response<Body>, Error> {
    let append = from_request::<PageViewAppend>(request)?;

    if let Err(err) = env
        .ddb
        .update_item()
        .table_name(env.table_name.to_string())
        .key("Path", append.path.into_attr())
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

    Ok(
        add_standard_headers(Response::builder().status(200), "application/json")
            .body(Body::Text("{}".to_string()))
            .expect("Failed to build response"),
    )
}
