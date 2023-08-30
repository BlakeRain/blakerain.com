use std::path::PathBuf;

use model::document::{encode_nodes, Details, Document};
use proc_macro::TokenStream;
use quote::{quote, TokenStreamExt};
use syn::{
    parse::{Parse, ParseStream},
    parse_str, Ident, LitStr,
};

use crate::{
    error::Error,
    parse::frontmatter::parse_front_matter,
    slug::{slug_constr, slug_ident},
};

mod highlight;
mod markdown;

fn load_documents(directory: &str) -> Result<Vec<Document<String>>, Error> {
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

#[derive(Default)]
struct Generator {
    enumerators: proc_macro2::TokenStream,
    display: proc_macro2::TokenStream,
    from_str: proc_macro2::TokenStream,
    detail_funcs: proc_macro2::TokenStream,
    detail_names: Vec<Ident>,
    render_funcs: proc_macro2::TokenStream,
    render_matches: proc_macro2::TokenStream,
}

fn generate_document(generator: &mut Generator, document: Document<String>) -> Result<(), Error> {
    let slug = document.details.summary.slug;
    let ident = slug_ident(&slug);

    let constr = slug_constr(&slug);
    let constr = parse_str::<Ident>(&constr).expect("document constructor");

    generator.enumerators.append_all(quote! {
        #constr,
    });

    generator.display.append_all(quote! {
        Self::#constr => #slug,
    });

    generator.from_str.append_all(quote! {
        #slug => Ok(Self::#constr),
    });

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

    let details_ident =
        parse_str::<Ident>(&format!("document_{ident}")).expect("document details identifier");

    generator.detail_names.push(details_ident.clone());
    generator.detail_funcs.append_all(quote! {
        fn #details_ident() -> Details<DocId> {
            Details {
                summary: Summary {
                    slug: DocId::#constr,
                    title: #title.to_string(),
                    excerpt: #excerpt,
                    published: #published
                },
                tags: vec![ #(#tags),* ],
                reading_time: #reading_time,
                cover_image: #cover_image,
            }
        }
    });

    let render_ident =
        parse_str::<Ident>(&format!("render_{ident}")).expect("document render identifier");

    let html = markdown::render(&document.content);
    let html = encode_nodes(html);
    let html = proc_macro2::Literal::byte_string(&html);

    generator.render_funcs.append_all(quote! {
        fn #render_ident() -> Vec<RenderNode> {
            decode_nodes(#html)
        }
    });

    generator.render_matches.append_all(quote! {
        DocId::#constr => Some((#details_ident(), #render_ident())),
    });

    Ok(())
}

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

pub fn generate(input: DocumentsInput) -> Result<TokenStream, Error> {
    let Generator {
        enumerators,
        display,
        from_str,
        detail_funcs,
        detail_names,
        render_funcs,
        render_matches,
    } = {
        let mut generator = Generator::default();
        for document in load_documents(&input.directory.value())? {
            generate_document(&mut generator, document)?;
        }

        generator
    };

    Ok(TokenStream::from(quote! {
        use model::document::*;

        #[derive(Debug, Copy, Clone, PartialEq, enum_iterator::Sequence)]
        pub enum DocId {
            #enumerators
        }

        impl std::fmt::Display for DocId {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", match self {
                    #display
                })
            }
        }

        impl std::str::FromStr for DocId {
            type Err = String;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    #from_str
                    _ => Err(format!("Unknown document '{}'", s))
                }
            }
        }

        #detail_funcs

        pub fn documents() -> Vec<Details<DocId>> {
            vec![ #(#detail_names()),* ]
        }

        #render_funcs

        pub fn render(ident: DocId) -> Option<(Details<DocId>, Vec<RenderNode>)> {
            match ident {
                #render_matches
                _ => None
            }
        }
    }))
}
