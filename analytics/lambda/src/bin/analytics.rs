use analytics_lambda::{
    config::{load_from_env, load_from_file},
    env::Env,
    handlers::{
        auth::{new_password, signin},
        page_view::{append_page_view, record_page_view},
    },
};
use analytics_model::MIGRATOR;
use lambda_runtime::Error;
use poem::{middleware, post, Endpoint, EndpointExt, Route};

async fn create() -> Result<impl Endpoint, Error> {
    let config = if cfg!(feature = "local") {
        load_from_file()
    } else {
        load_from_env().await
    }?;

    let env = Env::new(config).await;
    MIGRATOR.run(&env.pool).await?;

    Ok(Route::new()
        .at("/page_view", post(record_page_view))
        .at("/page_view/:id", post(append_page_view))
        .at("/auth/sign_in", post(signin))
        .at("/auth/new_password", post(new_password))
        .data(env)
        .with(middleware::Cors::new())
        .with(middleware::Tracing))
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let filter_layer = tracing_subscriber::filter::EnvFilter::builder()
        .with_default_directive(tracing_subscriber::filter::LevelFilter::INFO.into())
        .from_env_lossy();

    tracing_subscriber::fmt()
        .with_env_filter(filter_layer)
        .without_time()
        .with_ansi(cfg!(feature = "local"))
        .init();

    let endpoint = create().await?;

    if cfg!(feature = "local") {
        poem::Server::new(poem::listener::TcpListener::bind("127.0.0.1:3000"))
            .run(endpoint)
            .await?;
    } else {
        poem_lambda::run(endpoint).await?;
    }

    Ok(())
}
