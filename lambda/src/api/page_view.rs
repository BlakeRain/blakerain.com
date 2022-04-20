use http::Response;
use lambda_http::{Body, Request, RequestExt};
use lambda_runtime::Error;

use crate::{
    env::Env,
    model::{dynamodb::item::ToItem, page_view::PageView},
};

use super::utils::add_standard_headers;

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
