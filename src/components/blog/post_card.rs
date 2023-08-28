use model::document::Details;
use time::{format_description::FormatItem, macros::format_description};
use yew::{classes, function_component, html, use_context, Html, Properties};
use yew_router::prelude::Link;

use crate::{
    components::layout::intersperse::Intersperse,
    model::{blog::DocId, TagsContext},
    pages::Route,
};

const DATE_FORMAT: &[FormatItem] =
    format_description!("[day padding:none] [month repr:short] [year]");

fn post_card_image(doc_id: DocId, title: &str, image: &Option<String>) -> Html {
    html! {
        <Link<Route> classes="unstyled" to={Route::BlogPost { doc_id }}>
            <div class="relative w-full h-[240px]">
                if let Some(cover_image) = image {
                    <img class="rounded-xl object-cover absolute w-full h-full"
                            alt={title.to_string()}
                            src={cover_image.clone()} />
                }
            </div>
        </Link<Route>>
    }
}

pub fn post_card_details<S>(horizontal: bool, info: &Details<S>, tags: &TagsContext) -> Html {
    let mut facts = Intersperse::new(html! { <span class="text-gray-500">{"•"}</span> });

    if let Some(published) = info.summary.published {
        facts.push(html! { <div>{published.format(DATE_FORMAT).expect("valid format")}</div> });
    }

    if let Some(reading_time) = info.reading_time {
        facts.push(html! { <div>{format!("{reading_time} min read")}</div> })
    }

    let tags = Intersperse::from_iter(
        html! { <span class="text-gray-500">{"•"}</span> },
        info.tags.iter().map(|tag| {
            if let Some(tag) = tags.get(tag) {
                html! {
                    <span class="text-sky-700 dark:text-sky-500">{tag.name.clone()}</span>
                }
            } else {
                html! {
                    <span class="text-gray-500">{tag}</span>
                }
            }
        }),
    );

    html! {
        <div class={classes!("flex", "uppercase", "text-sm",
                             if horizontal {
                                 "flex-col md:flex-row md:justify-between"
                             } else {
                                 "flex-col"
                             })}>
            <div class="flex flex-row gap-1">
                {facts.finish()}
            </div>
            <div class="flex flex-row gap-1">
                {tags.finish()}
            </div>
        </div>
    }
}

fn post_card_description(info: &Details<DocId>, tags: &TagsContext) -> Html {
    html! {
        <div class="grow flex flex-col gap-4 justify-between">
            <Link<Route> classes="unstyled" to={Route::BlogPost { doc_id: info.summary.slug }}>
                <div class="flex flex-col gap-4">
                    <h1 class="text-2xl font-bold">{&info.summary.title}</h1>
                    if let Some(excerpt) = &info.summary.excerpt {
                        <p class="text-gray-500 dark:text-gray-400 font-text text-xl leading-relaxed">
                            {excerpt}
                        </p>
                    }
                </div>
            </Link<Route>>
            {post_card_details(false, info, tags)}
        </div>
    }
}

#[derive(Properties, PartialEq)]
pub struct PostCardProps {
    pub first: bool,
    pub post: Details<DocId>,
}

#[function_component(PostCard)]
pub fn post_card(props: &PostCardProps) -> Html {
    let tags = use_context::<TagsContext>().expect("TagsContext to be provided");

    if props.first {
        html! {
            <>
                {post_card_image(props.post.summary.slug,
                                 &props.post.summary.title,
                                 &props.post.cover_image)}
                <div class="xl:col-span-2 md:mt-4 lg:mt-0">
                    {post_card_description(&props.post, &tags)}
                </div>
            </>
        }
    } else {
        html! {
            <div class="flex flex-col gap-4 md:mt-20 lg:mt-0">
                {post_card_image(props.post.summary.slug,
                                 &props.post.summary.title,
                                 &props.post.cover_image)}
                {post_card_description(&props.post, &tags)}
            </div>
        }
    }
}
