use std::collections::HashMap;

use gray_matter::engine::Engine;
use model::properties::Properties;
use pulldown_cmark::{
    escape::{escape_href, escape_html, StrWrite},
    Alignment, CodeBlockKind, CowStr, Event, HeadingLevel, Tag,
};
use serde::Deserialize;
use syntect::html::highlighted_html_for_string;

use crate::parse::properties::{parse_language, parse_language_properties};

use super::highlight::{SYNTAX_SET, THEME_SET};

#[derive(Deserialize)]
struct Bookmark {
    url: String,
    title: String,
    description: Option<String>,
    author: Option<String>,
    publisher: Option<String>,
    thumbnail: Option<String>,
    icon: Option<String>,
}

fn generate_component_bookmark<W: StrWrite>(mut output: W, source: &str) -> std::io::Result<()> {
    let Bookmark {
        url,
        title,
        description,
        author,
        publisher,
        thumbnail,
        icon,
    } = gray_matter::engine::YAML::parse(source)
        .deserialize()
        .expect("Bookmark properties");

    write!(output, "<figure class=\"w-full text-base\">")?;
    write!(output, "<a href=\"")?;
    escape_href(&mut output, &url)?;
    write!(output, "\" class=\"")?;
    write!(
        output,
        "plain w-full flex flex-col lg:flex-row rounded-md shadow-md min-h-[148px] "
    )?;
    write!(
        output,
        "border border-neutral-300 dark:border-neutral-700\">"
    )?;

    if let Some(thumbnail) = thumbnail {
        write!(output, "<div class=\"relative lg:order-2 min-w-[33%] min-h-[160px] lg:min-h-fit max-h-[100%]\">")?;
        write!(
            output,
            "<img class=\"absolute top-0 left-0 w-full h-full rounded-r-md object-cover\" "
        )?;

        write!(output, "src=\"")?;
        escape_href(&mut output, &thumbnail)?;
        write!(output, "\" alt=\"")?;
        escape_html(&mut output, &title)?;

        write!(output, "\" loading=\"lazy\" decoding=\"async\" /></div>")?;
    }

    write!(
        output,
        "<div class=\"font-sans lg:order-1 grow flex flex-col justify-start align-start p-5\">"
    )?;
    write!(output, "<div class=\"font-semibold\">{title}</div>")?;

    if let Some(description) = description {
        write!(
            output,
            "<div class=\"grow overflow-y-hidden mt-3 max-h-12\">"
        )?;
        escape_html(&mut output, &description)?;
        write!(output, "</div>")?;
    }

    write!(
        output,
        "<div class=\"flex flex-row flex-wrap align-center gap-1 mt-3.5\">"
    )?;

    if let Some(icon) = icon {
        write!(
            output,
            "<img class=\"w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] mr-2\" alt=\""
        )?;
        escape_html(&mut output, publisher.as_deref().unwrap_or_default())?;
        write!(output, "\" src=\"")?;
        escape_href(&mut output, &icon)?;
        write!(output, "\" />")?;
    }

    if let Some(publisher) = publisher {
        write!(output, "<span>")?;
        escape_html(&mut output, &publisher)?;
        write!(output, "</span>")?;
        if author.is_some() {
            write!(
                output,
                r#"<svg xmlns="http://www.w3.org/2000/svg" data-license="From https://github.com/twbs/icons - Licensed under MIT" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" class="text-gray-500"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"></path></svg>"#
            )?;
        }
    }

    if let Some(author) = author {
        write!(output, "<span>")?;
        escape_html(&mut output, &author)?;
        write!(output, "</span>")?;
    }

    write!(output, "</div>")?;
    write!(output, "</div>")?;
    write!(output, "</a>")?;
    write!(output, "</figure>")
}

#[derive(Deserialize)]
pub struct Quote {
    pub quote: String,
    pub author: Option<String>,
    pub url: Option<String>,
}

fn generate_component_quote<W: StrWrite>(mut output: W, source: &str) -> std::io::Result<()> {
    let Quote { quote, author, url } = gray_matter::engine::YAML::parse(source)
        .deserialize()
        .expect("Bookmark properties");

    write!(output, "<figure class=\"quote\"><p>")?;
    escape_html(&mut output, &quote)?;
    write!(output, "</p>")?;

    if let Some(author) = author {
        write!(output, "<cite>")?;

        if let Some(url) = url {
            write!(output, "<a href=\"")?;
            escape_href(&mut output, &url)?;
            write!(output, "\" target=\"_blank\" rel=\"noreferrer\">")?;
            escape_html(&mut output, &author)?;
            write!(output, "</a>")?;
        } else {
            escape_html(&mut output, &author)?;
        }

        write!(output, "</cite>")?;
    }

    write!(output, "</figure>")
}

struct Highlighting {
    language: String,
    content: String,
}

pub struct Writer<'a, I, W> {
    tokens: I,
    writer: W,
    footnotes: HashMap<CowStr<'a>, usize>,
    highlight: Option<Highlighting>,
    table_align: Vec<Alignment>,
    table_head: bool,
    table_colidx: usize,
}

impl<'a, I, W> Writer<'a, I, W>
where
    I: Iterator<Item = Event<'a>>,
    W: StrWrite,
{
    pub fn new(tokens: I, writer: W) -> Self {
        Self {
            tokens,
            writer,
            footnotes: HashMap::new(),
            highlight: None,
            table_align: Vec::new(),
            table_head: false,
            table_colidx: 0,
        }
    }

    #[inline]
    fn write(&mut self, content: &str) -> std::io::Result<()> {
        self.writer.write_str(content)
    }

    fn component(&mut self, name: &str) -> std::io::Result<bool> {
        match name {
            "bookmark" => {
                let content = self.raw_text();
                generate_component_bookmark(&mut self.writer, &content)?;
                Ok(true)
            }

            "quote" => {
                let content = self.raw_text();
                generate_component_quote(&mut self.writer, &content)?;
                Ok(true)
            }

            _ => Ok(false),
        }
    }

    fn start(&mut self, tag: Tag) -> std::io::Result<()> {
        match tag {
            Tag::Paragraph => self.write("<p>"),

            Tag::Heading(level, ident, classes) => {
                self.write(match level {
                    HeadingLevel::H1 => "<h1",
                    HeadingLevel::H2 => "<h2",
                    HeadingLevel::H3 => "<h3",
                    HeadingLevel::H4 => "<h4",
                    HeadingLevel::H5 => "<h5",
                    HeadingLevel::H6 => "<h6",
                })?;

                if let Some(ident) = ident {
                    self.write(" id=\"")?;
                    escape_html(&mut self.writer, ident)?;
                    self.write("\"")?;
                }

                if !classes.is_empty() {
                    let classes = classes.join(" ");
                    self.write(" class=\"")?;
                    escape_html(&mut self.writer, &classes)?;
                    self.write("\"")?;
                }

                self.write(">")
            }

            Tag::BlockQuote => self.write("<blockquote>"),

            Tag::CodeBlock(kind) => {
                if let CodeBlockKind::Fenced(language) = &kind {
                    if self.component(language)? {
                        return Ok(());
                    }
                }

                let language = if let CodeBlockKind::Fenced(language) = kind {
                    if !language.is_empty() {
                        let language = parse_language(&language);
                        Some(language)
                    } else {
                        None
                    }
                } else {
                    None
                };

                self.write("<figure class=\"code\">")?;

                self.highlight = None;
                if let Some(language) = &language {
                    if language != "plain" {
                        self.highlight = Some(Highlighting {
                            language: language.to_string(),
                            content: String::new(),
                        });
                    }
                }

                if self.highlight.is_none() {
                    self.write("<pre><code>")?;
                }

                Ok(())
            }

            Tag::List(ordered) => {
                if let Some(start) = ordered {
                    self.write("<ol start=\"")?;
                    write!(self.writer, "{}", start)?;
                    self.write("\">")
                } else {
                    self.write("<ul>")
                }
            }

            Tag::Item => self.write("<li>"),

            Tag::Table(align) => {
                self.table_align = align;
                self.write("<table>")
            }

            Tag::TableHead => {
                self.table_head = true;
                self.write("<thead><tr>")
            }

            Tag::TableRow => {
                self.table_colidx = 0;
                self.write("<tr>")
            }

            Tag::TableCell => {
                if self.table_head {
                    self.write("<th")?;
                } else {
                    self.write("<td")?;
                }

                match self.table_align.get(self.table_colidx) {
                    Some(Alignment::Left) => self.write(" align=\"left\"")?,
                    Some(Alignment::Center) => self.write(" align=\"center\"")?,
                    Some(Alignment::Right) => self.write(" align=\"right\"")?,
                    _ => (),
                }

                self.write(">")
            }

            Tag::Emphasis => self.write("<em>"),
            Tag::Strong => self.write("<strong>"),
            Tag::Strikethrough => self.write("<s>"),

            Tag::Link(_, href, title) => {
                self.write("<a href=\"")?;
                escape_href(&mut self.writer, &href)?;
                self.write("\" title=\"")?;
                escape_html(&mut self.writer, &title)?;
                self.write("\">")
            }

            Tag::Image(_, href, title) => {
                self.write("<figure><img src=\"")?;
                escape_href(&mut self.writer, &href)?;
                self.write("\" title=\"")?;
                escape_html(&mut self.writer, &title)?;
                let alt = self.raw_text();
                self.write("\" alt=\"")?;
                escape_html(&mut self.writer, &alt)?;
                self.write("\"><figcaption>")?;
                escape_html(&mut self.writer, &alt)?;
                self.write("</figcaption></figure>")
            }

            _ => Ok(()),
        }
    }

    fn end(&mut self, tag: Tag) -> std::io::Result<()> {
        match tag {
            Tag::Paragraph => self.write("</p>"),

            Tag::Heading(level, _, _) => self.write(match level {
                HeadingLevel::H1 => "</h1>",
                HeadingLevel::H2 => "</h2>",
                HeadingLevel::H3 => "</h3>",
                HeadingLevel::H4 => "</h4>",
                HeadingLevel::H5 => "</h5>",
                HeadingLevel::H6 => "</h6>",
            }),

            Tag::BlockQuote => self.write("</blockquote>"),

            Tag::CodeBlock(kind) => {
                let mut highlight = None;
                std::mem::swap(&mut highlight, &mut self.highlight);
                if let Some(Highlighting { language, content }) = highlight {
                    let syntax = SYNTAX_SET
                        .find_syntax_by_token(&language)
                        .unwrap_or_else(|| panic!("Unknown language: {}", language));
                    let theme = THEME_SET.themes.get("base16-ocean.dark").unwrap();
                    let html = highlighted_html_for_string(&content, &SYNTAX_SET, syntax, theme)
                        .expect("syntax highlight");
                    self.writer.write_str(&html)?;
                } else {
                    self.write("</code></pre>")?;
                }

                let properties = if let CodeBlockKind::Fenced(language) = kind {
                    if !language.is_empty() {
                        let (_, properties) = parse_language_properties(&language)
                            .expect("valid language and properties");
                        properties
                    } else {
                        Properties::default()
                    }
                } else {
                    Properties::default()
                };

                if let Some(caption) = properties.get("caption") {
                    self.write("<figcaption>")?;
                    escape_html(&mut self.writer, caption)?;
                    self.write("</figcaption>")?;
                }

                self.write("</figure>")
            }

            Tag::List(ordered) => {
                if ordered.is_some() {
                    self.write("</ol>")
                } else {
                    self.write("</ul>")
                }
            }

            Tag::Item => self.write("</li>"),

            Tag::Table(_) => self.write("</tbody></table>"),

            Tag::TableHead => {
                self.table_head = false;
                self.write("</tr></thead><tbody>")
            }

            Tag::TableRow => self.write("</tr>"),

            Tag::TableCell => {
                if self.table_head {
                    self.write("</th>")?;
                } else {
                    self.write("</td>")?;
                }

                self.table_colidx += 1;
                Ok(())
            }

            Tag::Emphasis => self.write("</em>"),
            Tag::Strong => self.write("</strong>"),
            Tag::Strikethrough => self.write("</s>"),
            Tag::Link(_, _, _) => self.write("</a>"),

            _ => Ok(()),
        }
    }

    fn raw_text(&mut self) -> String {
        let mut output = String::new();
        let mut nest = 0;

        for event in self.tokens.by_ref() {
            match event {
                Event::Start(_) => nest += 1,
                Event::End(_) => {
                    if nest == 0 {
                        break;
                    }

                    nest -= 1;
                }

                Event::Html(text) | Event::Code(text) | Event::Text(text) => output.push_str(&text),
                Event::SoftBreak | Event::HardBreak | Event::Rule => output.push(' '),

                Event::FootnoteReference(name) => {
                    let next = self.footnotes.len() + 1;
                    let footnote = *self.footnotes.entry(name).or_insert(next);
                    output.push_str(&format!("[{footnote}]"));
                }

                Event::TaskListMarker(true) => output.push_str("[x]"),
                Event::TaskListMarker(false) => output.push_str("[ ]"),
            }
        }

        output
    }

    pub fn run(mut self) -> std::io::Result<()> {
        while let Some(event) = self.tokens.next() {
            match event {
                Event::Start(tag) => self.start(tag)?,
                Event::End(tag) => self.end(tag)?,

                Event::Text(text) => {
                    if let Some(highlight) = &mut self.highlight {
                        highlight.content.push_str(&text);
                    } else {
                        escape_html(&mut self.writer, &text)?;
                    }
                }

                Event::Code(text) => {
                    self.write("<code>")?;
                    escape_html(&mut self.writer, &text)?;
                    self.write("</code>")?;
                }

                Event::Html(html) => self.write(&html)?,

                Event::SoftBreak => {
                    if let Some(highlight) = &mut self.highlight {
                        highlight.content.push('\n');
                    } else {
                        self.write("\n")?;
                    }
                }

                Event::HardBreak => {
                    self.write("<br />")?;
                }

                _ => {}
            }
        }

        Ok(())
    }
}
