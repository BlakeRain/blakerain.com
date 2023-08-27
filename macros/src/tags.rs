use std::{io::Read, path::PathBuf};

use gray_matter::engine::Engine;
use model::tag::{Tag, TagVisibility};
use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse::{Parse, ParseStream},
    parse_str, Ident, LitStr,
};

use crate::{error::Error, slug::slug_constr};

pub struct TagsInput {
    pub file: LitStr,
}

impl Parse for TagsInput {
    fn parse(input: ParseStream) -> syn::Result<Self> {
        Ok(Self {
            file: input.parse()?,
        })
    }
}

fn generate_tag(
    Tag {
        slug,
        name,
        visibility,
        description,
    }: Tag,
) -> (
    (proc_macro2::TokenStream, Ident),
    (proc_macro2::TokenStream, proc_macro2::TokenStream),
) {
    let visibility = match visibility {
        TagVisibility::Public => quote! { model::tag::TagVisibility::Public },
        TagVisibility::Private => quote! { model::tag::TagVisibility::Private },
    };

    let description = match description {
        Some(description) => quote! { Some(#description.to_string()) },
        None => quote! { None },
    };

    let constr = parse_str::<Ident>(&slug_constr(&slug)).expect("tag slug constructor");

    (
        (
            quote! {
                tags.insert(#slug.to_string(), model::tag::Tag {
                    slug: #slug.to_string(),
                    name: #name.to_string(),
                    visibility: #visibility,
                    description: #description
                });
            },
            constr.clone(),
        ),
        (
            quote! {
                    TagId::#constr => #slug
            },
            quote! {
                #slug => Ok(TagId::#constr)
            },
        ),
    )
}

pub fn generate(input: TagsInput) -> Result<TokenStream, Error> {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.pop();
    path.push(input.file.value());

    let content = {
        let mut content = String::new();
        let mut file = std::fs::File::open(path)?;
        file.read_to_string(&mut content)?;
        content
    };

    let ((tag_inserts, tag_constrs), (tag_display, from_str)): (
        (Vec<_>, Vec<_>),
        (Vec<_>, Vec<_>),
    ) = gray_matter::engine::YAML::parse(&content)
        .deserialize::<Vec<Tag>>()?
        .into_iter()
        .map(generate_tag)
        .unzip();

    Ok(TokenStream::from(quote! {
        #[derive(Debug, Copy, Clone, PartialEq, enum_iterator::Sequence)]
        pub enum TagId {
            #(#tag_constrs),*
        }

        impl std::fmt::Display for TagId {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                write!(f, "{}", match self {
                    #(#tag_display),*
                })
            }
        }

        impl std::str::FromStr for TagId {
            type Err = String;

            fn from_str(s: &str) -> Result<Self, Self::Err> {
                match s {
                    #(#from_str),*,
                    _ => Err(format!("Unknown tag '{}'", s))
                }
            }
        }

        pub fn tags() -> std::collections::HashMap<String, model::tag::Tag> {
            let mut tags = HashMap::new();
            #(#tag_inserts)*
            tags
        }
    }))
}
