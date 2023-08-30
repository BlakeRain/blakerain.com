use lazy_static::lazy_static;
use syntect::{
    highlighting::ThemeSet,
    parsing::{SyntaxDefinition, SyntaxSet},
};

const TOML_RAW: &str = include_str!("toml.sublime-syntax");
const TYPESCRIPT_RAW: &str = include_str!("typescript.sublime-syntax");

pub fn create_syntaxset() -> SyntaxSet {
    let mut builder = SyntaxSet::load_defaults_newlines().into_builder();

    let toml_syntax = SyntaxDefinition::load_from_str(TOML_RAW, true, Some("toml")).unwrap();
    builder.add(toml_syntax);

    let typescript_syntax =
        SyntaxDefinition::load_from_str(TYPESCRIPT_RAW, true, Some("typescript")).unwrap();
    builder.add(typescript_syntax);

    builder.build()
}

lazy_static! {
    pub static ref SYNTAX_SET: SyntaxSet = create_syntaxset();
    pub static ref THEME_SET: ThemeSet = ThemeSet::load_defaults();
}
