use analytics_lambda::{
    config::{load_from_env, load_from_file},
    env::Env,
};
use analytics_model::MIGRATOR;
use lambda_runtime::{run, service_fn, Error, LambdaEvent};
use serde::Deserialize;
use sqlx::PgPool;

async fn destroy(pool: &PgPool) -> sqlx::Result<()> {
    sqlx::query("DROP SCHEMA public CASCADE")
        .execute(pool)
        .await?;

    sqlx::query("CREATE SCHEMA public").execute(pool).await?;

    sqlx::query("GRANT ALL ON SCHEMA public TO analytics")
        .execute(pool)
        .await?;

    sqlx::query("GRANT ALL ON SCHEMA public TO public")
        .execute(pool)
        .await?;

    Ok(())
}

#[derive(Deserialize)]
struct Options {
    #[serde(default)]
    destroy: bool,
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

    run(service_fn(
        move |event: LambdaEvent<serde_json::Value>| async move {
            let options: Options = serde_json::from_value(event.payload).expect("options");

            let config = if cfg!(feature = "local") {
                load_from_file()
            } else {
                load_from_env().await
            }?;

            let pool = Env::create_pool(&config).await;

            if options.destroy {
                log::info!("Destroying database");
                destroy(&pool).await?;
            }

            log::info!("Running migrations");
            MIGRATOR.run(&pool).await?;

            Ok::<(), Error>(())
        },
    ))
    .await?;

    Ok(())
}
