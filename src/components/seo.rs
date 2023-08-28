use time::{format_description::well_known::Rfc3339, OffsetDateTime};
use yew::{function_component, html, use_context, use_memo, Children, Html, Properties};
use yew_router::Routable;

use crate::{components::head::Head, model::TagsContext, pages::Route};

#[derive(Properties, PartialEq)]
pub struct LdJsonProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(LdJson)]
pub fn ld_json(props: &LdJsonProps) -> Html {
    html! {
        <Head>
            <script type="application/ld+json">
                {props.children.clone()}
            </script>
        </Head>
    }
}

#[derive(Properties, PartialEq)]
pub struct WebPageSeoProps {
    pub route: Route,
    pub title: String,
    pub excerpt: Option<String>,
    #[prop_or_default]
    pub index: bool,
    #[prop_or_default]
    pub follow: bool,
}

#[function_component(WebPageSeo)]
pub fn web_page_seo(props: &WebPageSeoProps) -> Html {
    let json = use_memo(
        |(title, excerpt)| {
            serde_json::json!({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": title,
              "description": excerpt,
              "publisher": {
                "@type": "ProfilePage",
                "name": "Blake Rain's Website"
              }
            })
            .to_string()
        },
        (props.title.clone(), props.excerpt.clone()),
    );

    let url = format!("https://blakerain.com{}", props.route.to_path());

    let robots = if props.index {
        if props.follow {
            "index,follow"
        } else {
            "index,nofollow"
        }
    } else if props.follow {
        "noindex,follow"
    } else {
        "noindex,nofollow"
    };

    html! {
        <>
            <LdJson>{json}</LdJson>
            <Head>
                <meta name="robots" content={robots} />

                if let Some(excerpt) = &props.excerpt {
                    <>
                        <meta name="description" content={excerpt.clone()} />
                        <meta property="og:description" content={excerpt.clone()} />
                    </>
                }

                <meta property="og:title" content={props.title.clone()} />
                <meta property="og:url" content={url} />
            </Head>
        </>
    }
}

#[derive(Properties, PartialEq)]
pub struct BlogPostSeoProps {
    pub route: Route,
    pub image: Option<String>,
    pub title: String,
    pub excerpt: Option<String>,
    pub published: Option<OffsetDateTime>,
    pub tags: Vec<String>,
}

#[function_component(BlogPostSeo)]
pub fn blog_post_seo(props: &BlogPostSeoProps) -> Html {
    let tags = use_context::<TagsContext>().expect("TagsCOntext to be provided");
    let tags = props
        .tags
        .iter()
        .filter_map(|tag| tags.get(tag).map(|tag| tag.name.clone()))
        .collect::<Vec<_>>();

    let url = format!("https://blakerain.com{}", props.route.to_path());
    let image = props
        .image
        .clone()
        .map(|image| format!("https://blakerain.com{image}"));
    let published = props
        .published
        .map(|time| time.format(&Rfc3339).expect("time format"));

    let json = use_memo(
        |(title, excerpt, image, url, published, tags)| {
            serde_json::json!({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "image": image,
              "url": url,
              "headline": title,
              "alternativeHeadline": excerpt,
              "dateCreated": published,
              "datePublished": published,
              "dateModified": published,
              "inLanguage": "en-GB",
              "isFamilyFriendly": "true",
              "keywords": tags,
              "accountablePerson": {
                "@type": "Person",
                "name": "Blake Rain",
                "url": "https://blakerain.com"
              },
              "author": {
                "@type": "Person",
                "name": "Blake Rain",
                "url": "https://blakerain.com"
              },
              "creator": {
                "@type": "Person",
                "name": "Blake Rain",
                "url": "https://blakerain.com"
              },
              "publisher": {
                "@type": "Organisation",
                "name": "Blake Rain",
                "url": "https://blakerain.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://blakerain.com/media/logo-text.png",
                  "width": "300",
                  "height": "56",
                }
              },
            })
            .to_string()
        },
        (
            props.title.clone(),
            props.excerpt.clone(),
            image.clone(),
            url.clone(),
            published.clone(),
            tags.clone(),
        ),
    );

    html! {
        <>
            <LdJson>{json}</LdJson>
            <Head>
                if let Some(excerpt) = &props.excerpt {
                    <>
                        <meta name="description" content={excerpt.clone()} />
                        <meta property="og:description" content={excerpt.clone()} />
                    </>
                }

                <meta property="og:type" content="article" />
                <meta property="og:title" content={props.title.clone()} />
                <meta property="og:url" content={url.clone()} />

                if let Some(image) = &image {
                    <>
                        <meta property="og:image" content={image.clone()} />
                        <meta property="og:image:alt" content={props.title.clone()} />
                    </>
                }

                <meta property="article:published_time" content={published} />
                <meta property="article:author" content="Blake Rain" />

                {
                    for tags.iter().map(|tag| html! {
                      <meta property="article:tag" content={tag.clone()} />
                    })
                }

                <link rel="canonical" href={url} />
            </Head>
        </>
    }
}
