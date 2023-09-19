use yew::{function_component, html, Children, Html, Properties};

#[derive(Properties, PartialEq)]
pub struct AuthContainerProps {
    pub title: String,
    pub message: Option<String>,
    pub error: Option<String>,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(AuthContainer)]
pub fn auth_container(
    AuthContainerProps {
        title,
        message,
        error,
        children,
    }: &AuthContainerProps,
) -> Html {
    html! {
        <div class="container mx-auto my-10 flex flex-row justify-center">
            <div class="flex flex-col gap-4 basis-full md:basis-2/3 lg:basis-1/2 xl:basis-1/3 p-4">
                <div>
                    <h1 class="text-xl font-semibold">{title}</h1>
                    if let Some(message) = message {
                        <h2>{message}</h2>
                    }
                </div>
                if let Some(error) = error {
                    <h2 class="dark:text-red-500 text-red-700">{error}</h2>
                }
                {children.clone()}
            </div>
        </div>
    }
}
