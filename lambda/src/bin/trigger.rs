use blakerain_analytics_lambdas::Env;
use lambda_runtime::{Context, Error, handler_fn};
use serde_json::Value;

async fn trigger_handler(env: &Env, event: Value) -> Result<(), Error> {
    println!("Trigger: {}", event);
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let env = Env::new().await;

    let handler_env = &env;
    let handler = move |event: Value, _: Context| async move {
        trigger_handler(handler_env, event).await
    };

    lambda_runtime::run(handler_fn(handler)).await?;
    Ok(())
}
