use yew::{function_component, html, use_context, Html, Properties};

use crate::{
    components::{blog::post_card::post_card_details, markdown::markdown},
    model::{source::TagsContext, Post},
};

#[derive(Properties, PartialEq)]
pub struct PostContentProps {}

#[function_component(PostContent)]
pub fn post_content(_: &PostContentProps) -> Html {
    let tags = use_context::<TagsContext>().expect("TagsContext to be provided");
    let post = use_context::<Post>().expect("Post to be provided");
    let style = if let Some(cover_image) = &post.info.cover_image {
        format!(
            "background-image: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url({})",
            cover_image
        )
    } else {
        "background-color: #000".to_string()
    };

    html! {
        <article>
            <header class="bg-[50%] bg-no-repeat bg-cover bg-fixed pt-20" {style}>
                <div class="container mx-auto">
                    <h1 class="text-5xl font-bold text-center text-white">
                        { &post.info.doc_info.title }
                    </h1>
                    if let Some(excerpt) = &post.info.doc_info.excerpt {
                        <p class="font-text text-2xl text-white text-center mt-5">
                            { excerpt }
                        </p>
                    }
                    <div class="mt-12 pt-8 px-16 bg-white dark:bg-zinc-900 rounded-t">
                        {post_card_details(true, &post.info, &tags)}
                    </div>
                </div>
            </header>
            <div class="container mx-auto">
                {markdown(&post.content)}
            </div>
        </article>
    }
}
