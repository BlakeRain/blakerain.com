use yew::{function_component, html, Html, Properties};
use yew_icons::{Icon, IconId};

#[derive(Properties, PartialEq)]
pub struct BookmarkProps {
    pub url: String,
    pub title: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub publisher: Option<String>,
    pub thumbnail: Option<String>,
    pub icon: Option<String>,
}

#[function_component(Bookmark)]
pub fn bookmark(props: &BookmarkProps) -> Html {
    html! {
        <figure class="w-full text-base">
            <a href={props.url.clone()}
                class="plain w-full flex flex-col lg:flex-row rounded-md shadow-md min-h-[148px] border border-neutral-300 dark:border-neutral-700">
                if let Some(thumbnail) = &props.thumbnail {
                    <div class="relative lg:order-2 min-w-[33%] min-h-[160px] lg:min-h-fit max-h-[100%]">
                        <img
                            class="absolute top-0 left-0 w-full h-full rounded-r-md object-cover"
                            src={thumbnail.clone()}
                            alt={props.title.clone()}
                            loading="lazy"
                            decoding="async" />
                    </div>
                }
                <div class="font-sans ld:order-1 grow flex flex-col justify-start align-start p-5">
                    <div class="font-semibold">{props.title.clone()}</div>
                    if let Some(description) = &props.description {
                        <div class="grow overflow-y-hidden mt-3 max-h-12">{description.clone()}</div>
                    }
                    <div class="flex flex-row flex-wrap align-center gap-1 mt-3.5">
                        if let Some(icon) = &props.icon {
                            <img
                                class="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] mr-2"
                                alt={props.publisher.clone()}
                                src={icon.clone()} />
                        }

                        if let Some(publisher) = &props.publisher {
                            <span>{publisher}</span>
                            if props.author.is_some() {
                                <Icon icon_id={IconId::BootstrapDot} />
                            }
                        }

                        if let Some(author) = &props.author {
                            <span>{author.clone()}</span>
                        }
                    </div>
                </div>
            </a>
        </figure>
    }
}
