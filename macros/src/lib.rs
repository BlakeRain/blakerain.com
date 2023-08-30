use documents::DocumentsInput;
use proc_macro::TokenStream;
use syn::parse_macro_input;
use tags::TagsInput;

mod documents;
mod error;
mod parse;
mod slug;
mod tags;

#[proc_macro]
pub fn documents(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DocumentsInput);
    documents::generate(input).expect("generate documents")
}

#[proc_macro]
pub fn tags(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as TagsInput);
    tags::generate(input).expect("generate tags")
}
