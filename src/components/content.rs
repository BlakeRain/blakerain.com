use model::document::Details;
use yew::{function_component, html, use_context, Html, Properties};

use crate::{components::blog::post_card::post_card_details, model::TagsContext};

#[derive(Properties, PartialEq)]
pub struct PostContentProps {
    pub details: Details,
    pub content: Html,
}

#[function_component(PostContent)]
pub fn post_content(props: &PostContentProps) -> Html {
    let tags = use_context::<TagsContext>().expect("TagsContext to be provided");
    let style = if let Some(cover_image) = &props.details.cover_image {
        format!(
            "background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url({})",
            cover_image
        )
    } else {
        "background-color: transparent".to_string()
    };

    html! {
        <article>
            <header class="bg-[50%] bg-no-repeat bg-cover bg-fixed pt-20" {style}>
                <div class="container mx-auto">
                    <h1 class="text-5xl font-bold text-center text-white">
                        { &props.details.summary.title }
                    </h1>
                    if let Some(excerpt) = &props.details.summary.excerpt {
                        <p class="font-text text-2xl text-white text-center mt-5">
                            { excerpt }
                        </p>
                    }
                    <div class="mt-12 pt-8 px-16 bg-white dark:bg-zinc-900 rounded-t">
                        {post_card_details(true, &props.details, &tags)}
                    </div>
                </div>
            </header>
            <div class="container mx-auto my-12 px-16 markdown">
                {props.content.clone()}
            </div>
        </article>
    }
}
