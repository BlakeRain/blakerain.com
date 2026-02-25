use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub fn setup_tracing(ansi: Option<bool>, verbosity: Option<u8>) {
    let fmt = tracing_subscriber::fmt::layer()
        .with_ansi(ansi.unwrap_or(true))
        .with_writer(std::io::stderr);
    let sub = tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(match verbosity {
            Some(0) | None => std::env::var("RUST_LOG").unwrap_or_else(|_| String::from("info")),
            Some(1) => String::from("debug"),
            Some(_) => String::from("trace"),
        }))
        .with(fmt);

    sub.init();
}
