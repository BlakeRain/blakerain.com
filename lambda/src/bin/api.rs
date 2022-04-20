use blakerain_analytics_lambdas::{
    api::{
        auth::handle_auth_signin,
        page_view::handle_page_view,
        utils::build_json,
        view_query::{
            handle_browsers_month, handle_browsers_week, handle_views_month, handle_views_week,
        },
    },
    env::Env,
};
use lambda_http::{handler, http::Method, Body, Context, Request, Response};
use lambda_runtime::Error;

use serde_json::json;

async fn api_handler(env: &Env, request: Request) -> Result<Response<Body>, Error> {
    match *request.method() {
        Method::OPTIONS => Ok(Response::builder()
            .status(204)
            .header("Allow", "OPTIONS, POST")
            .header("Access-Control-Allow-Methods", "AOPTIONS, POST")
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Headers", "*")
            .body(Body::Empty)
            .unwrap()),

        Method::GET => match request.uri().path() {
            "/pv.gif" => handle_page_view(env, &request).await,
            _ => Ok(build_json(404, json!({ "error": "Not Found" }))),
        },

        Method::POST => match request.uri().path() {
            "/api/auth/signin" => handle_auth_signin(env, &request).await,
            "/api/views/week" => handle_views_week(env, &request).await,
            "/api/views/month" => handle_views_month(env, &request).await,
            "/api/browsers/week" => handle_browsers_week(env, &request).await,
            "/api/browsers/month" => handle_browsers_month(env, &request).await,
            _ => Ok(build_json(
                404,
                json!({
                    "error": "Not Found"
                }),
            )),
        },
        _ => Ok(build_json(
            404,
            json!({
                "error": "Not Found"
            }),
        )),
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let env = Env::new().await;

    let handler_func_env = &env;
    let handler_func = move |req: Request, _cxt: Context| async move {
        let response = api_handler(handler_func_env, req).await;
        match response {
            Ok(res) => Ok(res),
            Err(err) => {
                println!("Error: {:?}", &err);
                Err(err)
            }
        }
    };

    lambda_runtime::run(handler(handler_func)).await?;
    Ok(())
}
