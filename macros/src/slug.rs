pub fn slug_ident(slug: &str) -> String {
    slug.replace('-', "_")
}

pub fn slug_constr(slug: &str) -> String {
    slug.split('-')
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
            }
        })
        .collect::<Vec<_>>()
        .join("")
}
