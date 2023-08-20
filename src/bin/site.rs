use site::app::App;

fn main() {
    #[cfg(target_arch = "wasm32")]
    wasm_logger::init(wasm_logger::Config::default());

    #[cfg(feature = "hydration")]
    {
        log::info!("Hydration build; hydrating application");
        yew::Renderer::<App>::new().hydrate();
    }

    #[cfg(not(feature = "hydration"))]
    {
        log::info!("Standard build; rendering application");
        yew::Renderer::<App>::new().render();
    }
}
