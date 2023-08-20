use site::app::App;

fn main() {
    #[cfg(target_arch = "wasm32")]
    wasm_logger::init(wasm_logger::Config::new(log::Level::Trace));

    #[cfg(feature = "hydration")]
    yew::Renderer::<App>::new().hydrate();

    #[cfg(not(feature = "hydration"))]
    yew::Renderer::<App>::new().render();
}
