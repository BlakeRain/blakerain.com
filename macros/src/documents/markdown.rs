use std::collections::HashMap;

use gray_matter::engine::Engine;
use model::{
    document::{AttributeName, RenderElement, RenderNode, RenderText, TagName},
    properties::Properties,
};
use pulldown_cmark::{Alignment, CodeBlockKind, CowStr, Event, HeadingLevel, Options, Parser, Tag};
use serde::Deserialize;
use syntect::{
    easy::HighlightLines,
    highlighting::{Color, FontStyle, Style},
    util::LinesWithEndings,
};

use crate::parse::properties::{parse_language, parse_language_properties};

use super::highlight::{SYNTAX_SET, THEME_SET};

pub fn heading_for_level(level: HeadingLevel) -> TagName {
    match level {
        HeadingLevel::H1 => TagName::H1,
        HeadingLevel::H2 => TagName::H2,
        HeadingLevel::H3 => TagName::H3,
        HeadingLevel::H4 => TagName::H4,
        HeadingLevel::H5 => TagName::H5,
        HeadingLevel::H6 => TagName::H6,
    }
}

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

#[derive(Deserialize)]
pub struct Quote {
    pub quote: String,
    pub author: Option<String>,
    pub url: Option<String>,
}

struct Highlighting {
    language: String,
    content: String,
}

impl Highlighting {
    pub fn finish(self) -> RenderElement {
        let syntax = SYNTAX_SET
            .find_syntax_by_token(&self.language)
            .unwrap_or_else(|| panic!("Unknown language: {}", self.language));

        let theme = THEME_SET.themes.get("base16-ocean.dark").expect("theme");
        let bg = theme.settings.background.unwrap_or(Color::WHITE);

        let mut pre = RenderElement::new(TagName::Pre);
        pre.add_attribute(
            AttributeName::Style,
            format!("background-color: #{:02x}{:02x}{:02x};", bg.r, bg.g, bg.b),
        );

        let mut highlighter = HighlightLines::new(syntax, theme);
        for line in LinesWithEndings::from(&self.content) {
            let regions = highlighter
                .highlight_line(line, &SYNTAX_SET)
                .expect("highlight");

            let mut active: Option<(Style, RenderElement)> = None;
            for (style, text) in regions {
                let unify_style = if let Some((active, _)) = &active {
                    style == *active
                        || (style.background == active.background && text.trim().is_empty())
                } else {
                    false
                };

                if unify_style {
                    let text = RenderText::new(text.to_string());
                    active.as_mut().unwrap().1.add_child(text);
                } else {
                    if let Some(active) = active.take() {
                        pre.add_child(active.1);
                    }

                    let mut style_attr = Vec::new();
                    if style.background != bg {
                        style_attr.push(format!(
                            "background-color:#{:02x}{:02x}{:02x}",
                            style.background.r, style.background.g, style.background.b
                        ));
                    }

                    if style.font_style.contains(FontStyle::BOLD) {
                        style_attr.push("font-weight:bold".to_string());
                    }

                    if style.font_style.contains(FontStyle::ITALIC) {
                        style_attr.push("font-style:italic".to_string());
                    }

                    if style.font_style.contains(FontStyle::UNDERLINE) {
                        style_attr.push("text-decoration:underline".to_string());
                    }

                    style_attr.push(format!(
                        "color:#{:02x}{:02x}{:02x}",
                        style.foreground.r, style.foreground.g, style.foreground.b
                    ));

                    let mut span = RenderElement::new(TagName::Span);
                    span.add_attribute(AttributeName::Style, style_attr.join(";"));
                    span.add_child(RenderText::new(text.to_string()));
                    active = Some((style, span));
                }
            }

            if let Some(active) = active.take() {
                pre.add_child(active.1)
            }
        }

        pre
    }
}

pub struct Renderer<'a, I> {
    tokens: I,
    output: Vec<RenderNode>,
    stack: Vec<RenderElement>,
    footnotes: HashMap<CowStr<'a>, usize>,
    highlight: Option<Highlighting>,
    table_align: Vec<Alignment>,
    table_head: bool,
    table_colidx: usize,
}

impl<'a, I> Renderer<'a, I>
where
    I: Iterator<Item = Event<'a>>,
{
    pub fn new(tokens: I) -> Self {
        Self {
            tokens,
            output: vec![],
            stack: vec![],
            footnotes: HashMap::new(),
            highlight: None,
            table_align: vec![],
            table_head: false,
            table_colidx: 0,
        }
    }

    fn output<N: Into<RenderNode>>(&mut self, node: N) {
        if let Some(top) = self.stack.last_mut() {
            top.add_child(node)
        } else {
            self.output.push(node.into());
        }
    }

    fn enter(&mut self, element: RenderElement) {
        self.stack.push(element);
    }

    fn leave(&mut self, tag: TagName) {
        let Some(top) = self.stack.pop() else {
            panic!("Stack underflow");
        };

        assert!(
            top.tag == tag,
            "Expected to pop <{}>, found <{}>",
            tag.as_str(),
            top.tag.as_str()
        );

        self.output(top)
    }

    fn generate_bookmark(&mut self, source: &str) {
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

        let mut figure = RenderElement::new(TagName::Figure);
        figure.add_attribute(AttributeName::Class, "w-full text-base");

        let mut link = RenderElement::new(TagName::A);
        link.add_attribute(AttributeName::Href, url);
        link.add_attribute(
            AttributeName::Class,
            "plain w-full flex flex-col lg:flex-row rounded-md shadow-md \
            min-h-[148px] border border-neutral-300 dark:border-neutral-700",
        );

        if let Some(thumbnail) = thumbnail {
            let mut div = RenderElement::new(TagName::Div);
            div.add_attribute(
                AttributeName::Class,
                "relative lg:order-2 min-w-[33%] min-h-[160px] lg:min-h-fit max-h-[100%]",
            );

            let mut img = RenderElement::new(TagName::Img);
            img.add_attribute(
                AttributeName::Class,
                "absolute top-0 left-0 w-full h-full rounded-r-md object-cover",
            );
            img.add_attribute(AttributeName::Src, thumbnail);
            img.add_attribute(AttributeName::Alt, title.clone());
            img.add_attribute(AttributeName::Loading, "lazy");
            img.add_attribute(AttributeName::Decoding, "async");

            div.add_child(img);
            link.add_child(div);
        }

        let mut container = RenderElement::new(TagName::Div);
        container.add_attribute(
            AttributeName::Class,
            "font-sans lg:order-1 grow flex flex-col justify-start align-start p-5",
        );

        container.add_child({
            let mut title_div = RenderElement::new(TagName::Div);
            title_div.add_attribute(AttributeName::Class, "font-semibold");
            title_div.add_child(RenderText::new(title));
            title_div
        });

        if let Some(description) = description {
            container.add_child({
                let mut descr_div = RenderElement::new(TagName::Div);
                descr_div
                    .add_attribute(AttributeName::Class, "grow overflow-y-hidden mt-3 max-h-12");
                descr_div.add_child(RenderText::new(description));
                descr_div
            });
        }

        let mut details = RenderElement::new(TagName::Div);
        details.add_attribute(
            AttributeName::Class,
            "flex flex-row flex-wrap align-center gap-1 mt-3.5",
        );

        if let Some(icon) = icon {
            let mut img = RenderElement::new(TagName::Img);
            img.add_attribute(
                AttributeName::Class,
                "w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] mr-3",
            );
            img.add_attribute(AttributeName::Alt, publisher.clone().unwrap_or_default());
            img.add_attribute(AttributeName::Src, icon);
            details.add_child(img);
        }

        if let Some(publisher) = publisher {
            let mut span = RenderElement::new(TagName::Span);
            span.add_child(RenderText::new(publisher));
            details.add_child(span);

            if author.is_some() {
                let mut dot = RenderElement::new(TagName::Span);
                dot.add_child(RenderText::new("•"));
                details.add_child(dot);
            }
        }

        if let Some(author) = author {
            let mut span = RenderElement::new(TagName::Span);
            span.add_child(RenderText::new(author));
            details.add_child(span);
        }

        container.add_child(details);
        link.add_child(container);
        figure.add_child(link);
        self.output(figure);
    }

    fn generate_quote(&mut self, source: &str) {
        let Quote { quote, author, url } = gray_matter::engine::YAML::parse(source)
            .deserialize()
            .expect("Bookmark properties");

        let mut figure = RenderElement::new(TagName::Figure);
        figure.add_attribute(AttributeName::Class, "quote");

        let mut p = RenderElement::new(TagName::P);
        p.add_child(RenderText::new(quote));
        figure.add_child(p);

        if let Some(author) = author {
            let mut cite = RenderElement::new(TagName::Cite);

            if let Some(url) = url {
                let mut link = RenderElement::new(TagName::A);
                link.add_attribute(AttributeName::Href, url);
                link.add_child(RenderText::new(author));
                cite.add_child(link);
            } else {
                cite.add_child(RenderText::new(author));
            }

            figure.add_child(cite);
        }

        self.output(figure);
    }

    fn component(&mut self, name: &str) -> bool {
        match name {
            "bookmark" => {
                let content = self.raw_text();
                self.generate_bookmark(&content);
                true
            }

            "quote" => {
                let content = self.raw_text();
                self.generate_quote(&content);
                true
            }

            _ => false,
        }
    }

    fn start(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => self.enter(RenderElement::new(TagName::P)),

            Tag::Heading(level, ident, classes) => {
                let mut heading = RenderElement::new(heading_for_level(level));

                if let Some(ident) = ident {
                    heading.add_attribute(AttributeName::Id, ident.to_string());
                }

                if !classes.is_empty() {
                    let classes = classes.join(" ");
                    heading.add_attribute(AttributeName::Class, classes);
                }

                self.enter(heading);
            }

            Tag::BlockQuote => self.enter(RenderElement::new(TagName::BlockQuote)),

            Tag::CodeBlock(kind) => {
                if let CodeBlockKind::Fenced(language) = &kind {
                    if self.component(language) {
                        return;
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

                let mut figure = RenderElement::new(TagName::Figure);
                figure.add_attribute(AttributeName::Class, "code");
                self.enter(figure);

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
                    self.enter(RenderElement::new(TagName::Pre));
                }
            }

            Tag::List(ordered) => self.enter(if let Some(start) = ordered {
                let mut ol = RenderElement::new(TagName::Ol);
                ol.add_attribute(AttributeName::Start, start.to_string());
                ol
            } else {
                RenderElement::new(TagName::Ul)
            }),

            Tag::Item => self.enter(RenderElement::new(TagName::Li)),

            Tag::Table(align) => {
                self.table_align = align;
                self.enter(RenderElement::new(TagName::Table));
            }

            Tag::TableHead => {
                self.table_head = true;
                self.enter(RenderElement::new(TagName::THead));
                self.enter(RenderElement::new(TagName::Tr));
            }

            Tag::TableRow => {
                self.table_colidx = 0;
                self.enter(RenderElement::new(TagName::Tr));
            }

            Tag::TableCell => {
                let mut cell = RenderElement::new(if self.table_head {
                    TagName::Th
                } else {
                    TagName::Td
                });

                if let Some(align) =
                    self.table_align
                        .get(self.table_colidx)
                        .and_then(|align| match align {
                            Alignment::None => None,
                            Alignment::Left => Some("left"),
                            Alignment::Right => Some("right"),
                            Alignment::Center => Some("center"),
                        })
                {
                    cell.add_attribute(AttributeName::Class, align);
                }

                self.enter(cell);
            }

            Tag::Emphasis => self.enter(RenderElement::new(TagName::Em)),
            Tag::Strong => self.enter(RenderElement::new(TagName::Strong)),
            Tag::Strikethrough => self.enter(RenderElement::new(TagName::S)),

            Tag::Link(_, href, title) => {
                let mut a = RenderElement::new(TagName::A);
                a.add_attribute(AttributeName::Title, title.to_string());
                a.add_attribute(AttributeName::Href, href.to_string());
                self.enter(a);
            }

            Tag::Image(_, src, title) => {
                // If the element we're to be inserted into is going to be a <p>, then we want to
                // discard it: we can't construct: <p><figure>...</figure></p> as that is invalid
                // HTML.
                let p = if let Some(RenderElement {
                    tag: TagName::P, ..
                }) = self.stack.last()
                {
                    self.stack.pop()
                } else {
                    None
                };

                let mut figure = RenderElement::new(TagName::Figure);
                let mut img = RenderElement::new(TagName::Img);
                img.add_attribute(AttributeName::Src, src.to_string());
                img.add_attribute(AttributeName::Title, title.to_string());

                let alt = self.raw_text();
                img.add_attribute(AttributeName::Alt, alt.clone());
                figure.add_child(img);

                let mut figcaption = RenderElement::new(TagName::FigCaption);
                figcaption.add_child(RenderText::new(alt));
                figure.add_child(figcaption);
                self.output(figure);

                // If we ended up removing the <p>, then we want to reinstate it.
                p.map(|p| self.enter(p));
            }

            _ => {}
        }
    }

    fn end(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => {
                // We behave here very similarly to `Self::leave()`, except we want to make sure we
                // don't push any empty paragraphs. This can happen when Markdown places images
                // inside paragraphs and we discard them.

                let Some(top) = self.stack.pop() else {
                    panic!("Stack undeflow");
                };

                assert!(
                    top.tag == TagName::P,
                    "Expected to pop <p>, found <{}>",
                    top.tag.as_str(),
                );

                if !top.children.is_empty() {
                    self.output(top);
                }
            }

            Tag::Heading(level, _, _) => self.leave(heading_for_level(level)),
            Tag::BlockQuote => self.leave(TagName::BlockQuote),

            Tag::CodeBlock(kind) => {
                let mut highlight = None;
                std::mem::swap(&mut highlight, &mut self.highlight);
                if let Some(highlight) = highlight {
                    let pre = highlight.finish();
                    self.output(pre);
                } else {
                    self.leave(TagName::Pre); // <pre>
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
                    let mut figcap = RenderElement::new(TagName::FigCaption);
                    figcap.add_child(RenderText::new(caption.to_string()));
                    self.output(figcap);
                }

                self.leave(TagName::Figure); // <figure>
            }

            Tag::List(ordered) => self.leave(if ordered.is_some() {
                TagName::Ol
            } else {
                TagName::Ul
            }),

            Tag::Item => self.leave(TagName::Li),

            Tag::Table(_) => {
                self.leave(TagName::TBody);
                self.leave(TagName::Table);
            }

            Tag::TableRow => self.leave(TagName::Tr),

            Tag::TableHead => {
                self.leave(TagName::Tr);
                self.leave(TagName::THead);
                self.enter(RenderElement::new(TagName::TBody));
                self.table_head = false;
            }

            Tag::TableCell => {
                self.leave(if self.table_head {
                    TagName::Th
                } else {
                    TagName::Td
                });

                self.table_colidx += 1;
            }

            Tag::Emphasis => self.leave(TagName::Em),
            Tag::Strong => self.leave(TagName::Strong),
            Tag::Strikethrough => self.leave(TagName::S),
            Tag::Link(_, _, _) => self.leave(TagName::A),

            _ => {}
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

    fn event(&mut self, event: Event) {
        match event {
            Event::Start(tag) => self.start(tag),
            Event::End(tag) => self.end(tag),

            Event::Text(text) => {
                if let Some(highlight) = &mut self.highlight {
                    highlight.content.push_str(&text);
                } else {
                    self.output(RenderText::new(text.to_string()))
                }
            }

            Event::Code(text) => {
                let mut code = RenderElement::new(TagName::Code);
                code.add_child(RenderText::new(text.to_string()));
                self.output(code)
            }

            Event::Html(html) => {
                eprintln!("Ignoring html: {html:#?}")
            }

            Event::SoftBreak => {
                if let Some(highlight) = &mut self.highlight {
                    highlight.content.push('\n');
                } else {
                    self.output(RenderText::new("\n".to_string()));
                }
            }

            Event::HardBreak => {
                self.output(RenderElement::new(TagName::Br));
            }

            _ => {}
        }
    }

    pub fn run(mut self) -> Vec<RenderNode> {
        while let Some(event) = self.tokens.next() {
            self.event(event);
        }

        self.output
    }
}

pub fn render(content: &str) -> Vec<RenderNode> {
    Renderer::new(Parser::new_ext(content, Options::all())).run()
}
