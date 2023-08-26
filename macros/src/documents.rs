use std::path::PathBuf;

use model::document::{Details, Document};
use proc_macro::TokenStream;
use pulldown_cmark::{Options, Parser};
use quote::{quote, TokenStreamExt};
use syn::{
    parse::{Parse, ParseStream},
    parse_str, Ident, LitStr,
};

use crate::{error::Error, parse::frontmatter::parse_front_matter};

use self::writer::Writer;

mod highlight;
mod writer;

pub struct DocumentsInput {
    pub directory: LitStr,
}

impl Parse for DocumentsInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(Self {
            directory: input.parse()?,
        })
    }
}

fn load_documents(directory: &str) -> Result<Vec<Document>, Error> {
    let mut root_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    root_dir.pop();
    root_dir.push(directory);
    eprintln!("Loading documents from: {}", root_dir.display());

    let mut results = Vec::new();
    for entry in std::fs::read_dir(root_dir)? {
        let entry = entry?;
        let content = std::fs::read(entry.path())?;

        let (Some(front_matter), matter) = parse_front_matter(&content[..])? else {
            return Err(Error::MissingFrontMatter(entry.path().to_string_lossy().to_string()))
        };

        let slug = entry
            .path()
            .file_stem()
            .expect("filename")
            .to_str()
            .expect("valid file name")
            .to_string();

        let reading_time = words_count::count(&matter.content).words / 200;

        results.push(Document {
            details: Details::from_front_matter(slug, Some(reading_time), front_matter),
            content: matter.content,
        })
    }

    results.sort_by(|a, b| {
        b.details
            .summary
            .published
            .cmp(&a.details.summary.published)
    });

    Ok(results)
}

fn generate_document(
    document: Document,
) -> Result<(Ident, proc_macro2::TokenStream, proc_macro2::TokenStream), Error> {
    let slug = document.details.summary.slug;
    let title = document.details.summary.title;
    let excerpt = match document.details.summary.excerpt {
        Some(excerpt) => quote! { Some(#excerpt.to_string()) },
        None => quote! { None },
    };

    let published = match document.details.summary.published {
        Some(published) => {
            let timestamp = published.unix_timestamp();
            quote! { Some(time::OffsetDateTime::from_unix_timestamp(#timestamp).unwrap()) }
        }
        None => quote! { None },
    };

    let reading_time = match document.details.reading_time {
        Some(reading_time) => quote! { Some(#reading_time) },
        None => quote! { None },
    };

    let cover_image = match document.details.cover_image {
        Some(cover_image) => quote! { Some(#cover_image.to_string()) },
        None => quote! { None },
    };

    let tags = document
        .details
        .tags
        .into_iter()
        .map(|tag| quote! { #tag.to_string() });

    // Replace the use of '-' with '_' in the document slug to get the name of the document as a
    // Rust identifier.
    let name = slug.replace('-', "_");
    let doc_ident = parse_str::<Ident>(&(format!("document_{name}"))).expect("document identifier");
    let render_ident =
        parse_str::<Ident>(&(format!("render_{name}"))).expect("document identifier");

    let parser = Parser::new_ext(&document.content, Options::all());
    let mut html = String::new();
    Writer::new(parser, &mut html).run().expect("HTML");

    let doc_func = quote! {
        fn #doc_ident() -> Details {
            Details {
                summary: Summary {
                    slug: #slug.to_string(),
                    title: #title.to_string(),
                    excerpt: #excerpt,
                    published: #published
                },
                tags: vec![ #(#tags),* ],
                reading_time: #reading_time,
                cover_image: #cover_image,
            }
        }

        fn #render_ident() -> yew::Html {
            yew::Html::from_html_unchecked(yew::AttrValue::from(#html))
        }
    };

    Ok((
        doc_ident.clone(),
        doc_func,
        quote! {
            #slug => Some((#doc_ident(), #render_ident())),
        },
    ))
}

pub fn generate(input: DocumentsInput) -> Result<TokenStream, Error> {
    let documents = load_documents(&input.directory.value())?;

    let mut combined = quote! {};
    let mut doc_funcs = Vec::new();
    let mut doc_renders = Vec::new();

    for document in documents {
        let (doc_ident, doc_func, doc_render) = generate_document(document)?;
        combined.append_all(doc_func);
        doc_funcs.push(doc_ident);
        doc_renders.push(doc_render);
    }

    Ok(TokenStream::from(quote! {
        use model::document::*;

        #combined

        pub fn documents() -> Vec<Details> {
            vec![ #(#doc_funcs()),* ]
        }

        pub fn render(slug: &str) -> Option<(Details, yew::Html)> {
            match slug {
                #(#doc_renders)*
                _ => None
            }
        }
    }))
}
