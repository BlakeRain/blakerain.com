use std::sync::LazyLock;

use pulldown_cmark_escape::escape_html;
use two_face::re_exports::syntect::{
    html::{ClassStyle, ClassedHTMLGenerator},
    parsing::SyntaxSet,
    util::LinesWithEndings,
};

static SYNTAX_SET: LazyLock<SyntaxSet> = LazyLock::new(two_face::syntax::extra_newlines);

pub fn highlight(code: &str, lang: &str) -> String {
    let mut out = String::with_capacity(code.len() + 128);

    out.push_str(r#"<pre tabindex="0"><code class="language-"#);
    escape_html(&mut out, lang).expect("failed to escape HTML");
    out.push('"');
    out.push('>');

    let Some(syntax) = SYNTAX_SET.find_syntax_by_token(lang) else {
        tracing::warn!("failed to resolve syntax for {}", lang);

        out.push_str(code);
        out.push_str("</code></pre>");
        return out;
    };

    let mut generator = ClassedHTMLGenerator::new_with_class_style(
        syntax,
        &SYNTAX_SET,
        ClassStyle::SpacedPrefixed { prefix: "syn-" },
    );

    for line in LinesWithEndings::from(code) {
        generator
            .parse_html_for_line_which_includes_newline(line)
            .expect("failed to parse HTML");
    }

    let result = generator.finalize();
    out.push_str(&result);
    out.push_str("</code></pre>");

    out
}
