pub fn slug_ident(slug: &str) -> String {
    slug.replace('-', "_")
}

pub fn slug_constr(slug: &str) -> String {
    slug.split('-').map(titlecase).collect::<Vec<_>>().join("")
}

pub fn titlecase(word: &str) -> String {
    let mut chars = word.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}
