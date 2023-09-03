use site::app::App;

fn main() {
    #[cfg(target_arch = "wasm32")]
    wasm_logger::init(wasm_logger::Config::default());

    log::info!(
        "blakerain.com {}, {} {} build",
        env!("CARGO_PKG_VERSION"),
        if cfg!(debug_assertions) {
            "debug"
        } else {
            "release"
        },
        if cfg!(feature = "hydration") {
            "hydration"
        } else {
            "standard"
        }
    );

    log::info!("Compiled {}", env!("BUILD_TIME"));

    let app = yew::Renderer::<App>::new();

    #[cfg(feature = "hydration")]
    {
        log::info!("Hydrating application");
        app.hydrate();
    }

    #[cfg(not(feature = "hydration"))]
    {
        log::info!("Rendering application");
        app.render();
    }
}
