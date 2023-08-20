use site::app::App;
use yew::ServerRenderer;

#[tokio::main]
async fn main() {
    let renderer = ServerRenderer::<App>::new();
    println!("{}", renderer.render().await);
}
