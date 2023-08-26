use std::{io::Read, path::PathBuf};

use gray_matter::engine::Engine;
use model::tag::{Tag, TagVisibility};
use proc_macro::TokenStream;
use quote::quote;
use syn::{
    parse::{Parse, ParseStream},
    LitStr,
};

use crate::error::Error;

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
) -> proc_macro2::TokenStream {
    let visibility = match visibility {
        TagVisibility::Public => quote! { model::tag::TagVisibility::Public },
        TagVisibility::Private => quote! { model::tag::TagVisibility::Private },
    };

    let description = match description {
        Some(description) => quote! { Some(#description.to_string()) },
        None => quote! { None },
    };

    quote! {
        tags.insert(#slug.to_string(), model::tag::Tag {
            slug: #slug.to_string(),
            name: #name.to_string(),
            visibility: #visibility,
            description: #description
        });
    }
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

    let tags = gray_matter::engine::YAML::parse(&content)
        .deserialize::<Vec<Tag>>()?
        .into_iter()
        .map(generate_tag);

    Ok(TokenStream::from(quote! {
        pub fn tags() -> std::collections::HashMap<String, model::tag::Tag> {
            let mut tags = HashMap::new();
            #(#tags)*
            tags
        }
    }))
}
