use time::{format_description::FormatItem, macros::format_description};
use yew::{function_component, html, use_context, Html, Properties};
use yew_icons::{Icon, IconId};
use yew_router::prelude::Link;

use crate::{
    components::layout::intersperse::Intersperse,
    model::{source::TagsContext, PostInfo},
    pages::Route,
};

const DATE_FORMAT: &[FormatItem] =
    format_description!("[day padding:none] [month repr:short] [year]");

fn post_card_image(slug: &str, image: &Option<String>) -> Html {
    html! {
        <Link<Route> classes="unstyled" to={Route::BlogPost { slug: slug.to_string() }}>
            <div class="relative w-full h-[240px]">
                if let Some(cover_image) = image {
                    <img class="rounded-xl object-cover absolute w-full h-full"
                            src={cover_image.clone()} />
                }
            </div>
        </Link<Route>>
    }
}

fn post_card_details(info: &PostInfo, tags: &TagsContext) -> Html {
    let mut facts =
        Intersperse::new(html! { <Icon class="text-gray-500" icon_id={IconId::BootstrapDot} /> });

    if let Some(published) = info.doc_info.published {
        facts.push(html! { <div>{published.format(DATE_FORMAT).expect("valid format")}</div> });
    }

    if let Some(reading_time) = info.reading_time {
        facts.push(html! { <div>{format!("{reading_time} min read")}</div> })
    }

    let tags = Intersperse::from_iter(
        html! { <Icon class="text-gray-500" icon_id={IconId::BootstrapDot} /> },
        info.tags.iter().map(|tag| {
            if let Some(tag) = tags.get(tag) {
                html! {
                    <Link<Route>
                        classes="text-sky-500 hover:text-sky-600"
                        to={Route::Tag { slug: tag.slug.clone() }}>
                        {tag.name.clone()}
                    </Link<Route>>
                }
            } else {
                html! {
                    <span class="text-gray-500">{tag}</span>
                }
            }
        }),
    );

    html! {
        <div class="flex flex-col uppercase text-sm">
            <div class="flex flex-row">
                {facts.finish()}
            </div>
            <div class="flex flex-row">
                {tags.finish()}
            </div>
        </div>
    }
}

fn post_card_description(info: &PostInfo, tags: &TagsContext) -> Html {
    html! {
        <div class="grow flex flex-col gap-4 justify-between">
            <Link<Route> classes="unstyled" to={Route::BlogPost { slug: info.doc_info.slug.clone() }}>
                <div class="flex flex-col gap-4">
                    <h1 class="text-2xl font-bold">{&info.doc_info.title}</h1>
                    if let Some(excerpt) = &info.doc_info.excerpt {
                        <p class="text-gray-500 font-text text-xl">{excerpt}</p>
                    }
                </div>
            </Link<Route>>
            {post_card_details(info, tags)}
        </div>
    }
}

#[derive(Properties, PartialEq)]
pub struct PostCardProps {
    pub first: bool,
    pub post: PostInfo,
}

#[function_component(PostCard)]
pub fn post_card(props: &PostCardProps) -> Html {
    let tags = use_context::<TagsContext>().expect("TagsContext to be provided");

    if props.first {
        html! {
            <>
                {post_card_image(&props.post.doc_info.slug, &props.post.cover_image)}
                <div class="col-span-2">
                    {post_card_description(&props.post, &tags)}
                </div>
            </>
        }
    } else {
        html! {
            <div class="flex flex-col gap-4">
                {post_card_image(&props.post.doc_info.slug, &props.post.cover_image)}
                {post_card_description(&props.post, &tags)}
            </div>
        }
    }
}
