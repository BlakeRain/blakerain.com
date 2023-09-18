use model::document::{Details, RenderNode};
use yew::{function_component, html, use_context, Html, Properties};

use crate::{
    components::{blog::post_card::post_card_details, render::Render},
    model::TagsContext,
};

#[derive(Properties, PartialEq)]
pub struct PostContentProps<S: PartialEq> {
    pub details: Details<S>,
    pub content: Vec<RenderNode>,
}

#[function_component(PostContent)]
pub fn post_content<S: PartialEq>(props: &PostContentProps<S>) -> Html {
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
            <header class="hidden print:block container print:max-w-full mx-auto">
                <h1 class="text-3xl font-bold">
                    { &props.details.summary.title }
                </h1>
                {post_card_details(true, &props.details, &tags)}
            </header>
            <header class="print:hidden bg-[50%] bg-no-repeat bg-cover bg-fixed pt-20" {style}>
                <div class="container mx-auto flex flex-col items-center">
                    <h1 class="text-5xl text-center font-bold text-white mx-2">
                        { &props.details.summary.title }
                    </h1>
                    if let Some(excerpt) = &props.details.summary.excerpt {
                        <p class="font-sans text-lg text-center text-white mt-5 mx-2 w-full xl:w-2/3">
                            { excerpt }
                        </p>
                    }
                    <div class="mt-12 pt-8 px-16 bg-white dark:bg-zinc-900 rounded-t w-full">
                        {post_card_details(true, &props.details, &tags)}
                    </div>
                </div>
            </header>
            <div class="container mx-auto mt-12 mb-20 px-2 sm:px-16 print:px-0 print:max-w-full markdown">
                {
                    props.content.iter().map(|node| html! {
                        <Render node={node.clone()} />
                    })
                    .collect::<Html>()
                }
            </div>
        </article>
    }
}
