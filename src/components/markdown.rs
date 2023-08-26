use std::{collections::HashMap, fmt::Write, str::FromStr};

use gray_matter::engine::Engine;
use pulldown_cmark::{Alignment, CodeBlockKind, CowStr, Event, HeadingLevel, Options, Parser, Tag};
use serde::Deserialize;
use yew::{
    html,
    virtual_dom::{VList, VNode, VTag, VText},
    Html,
};
use yew_icons::{Icon, IconId};

use crate::model::properties::{Properties, PropertiesParseError};

fn parse_language_properties(input: &str) -> Result<(String, Properties), PropertiesParseError> {
    let input = input.trim();
    if let Some((language, rest)) = input.split_once(' ') {
        let rest = rest.trim();
        let properties = if rest.is_empty() {
            Properties::default()
        } else {
            Properties::from_str(rest)?
        };

        Ok((language.to_string(), properties))
    } else {
        Ok((input.to_string(), Properties::default()))
    }
}

#[derive(Deserialize)]
struct BookmarkDecl {
    url: String,
    title: String,
    description: Option<String>,
    author: String,
    publisher: Option<String>,
    thumbnail: Option<String>,
    icon: Option<String>,
}

impl BookmarkDecl {
    fn generate(self) -> VNode {
        html! {
            <figure class="w-full text-base">
                <a href={self.url}
                   class="plain w-full flex flex-col lg:flex-row rounded-md shadow-md min-h-[148px] border border-neutral-300 dark:border-neutral-700">
                    if let Some(thumbnail) = self.thumbnail {
                        <div class="relative lg:order-2 min-w-[33%] min-h-[160px] lg:min-h-fit max-h-[100%]">
                            <img
                                class="absolute top-0 left-0 w-full h-full rounded-r-md object-cover"
                                src={thumbnail}
                                alt={self.title.clone()}
                                loading="lazy"
                                decoding="async" />
                        </div>
                    }
                    <div class="font-sans ld:order-1 grow flex flex-col justify-start align-start p-5">
                        <div class="font-semibold">{self.title}</div>
                        if let Some(description) = self.description {
                            <div class="grow overflow-y-hidden mt-3 max-h-12">{description}</div>
                        }
                        <div class="flex flex-row flex-wrap align-center gap-1 mt-3.5">
                            if let Some(icon) = self.icon {
                                <img
                                    class="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px] mr-2"
                                    alt={self.publisher.clone()}
                                    src={icon} />
                            }

                            if let Some(publisher) = self.publisher {
                                <span>{publisher}</span>
                                if !self.author.is_empty() {
                                    <Icon icon_id={IconId::BootstrapDot} />
                                }
                            }

                            if !self.author.is_empty() {
                                <span>{self.author}</span>
                            }
                        </div>
                    </div>
                </a>
            </figure>
        }
    }
}

#[derive(Deserialize)]
struct QuoteDecl {
    quote: String,
    author: Option<String>,
    url: Option<String>,
}

impl QuoteDecl {
    fn generate(self) -> VNode {
        let cite = self.author.map(|author| {
            self.url
                .map(|url| {
                    html! {
                        <cite>
                            <a href={url} target="_blank" rel="noreferrer">{author.clone()}</a>
                        </cite>
                    }
                })
                .unwrap_or_else(|| html! { <cite>{author.clone()}</cite> })
        });

        html! {
            <figure class="quote">
                <p>{self.quote}</p>
                {cite}
            </figure>
        }
    }
}

enum GeneratorBlock {
    Bookmark(BookmarkDecl),
    Quote(QuoteDecl),
}

impl GeneratorBlock {
    fn new_bookmark(content: String) -> Self {
        let decl = gray_matter::engine::YAML::parse(&content)
            .deserialize()
            .expect("BookmarkDecl");
        Self::Bookmark(decl)
    }

    fn new_quote(content: String) -> Self {
        let decl = gray_matter::engine::YAML::parse(&content)
            .deserialize()
            .expect("QuoteDecl");
        Self::Quote(decl)
    }

    fn generate(self) -> VNode {
        match self {
            Self::Bookmark(decl) => decl.generate(),
            Self::Quote(decl) => decl.generate(),
        }
    }
}

struct Generator(pub Box<dyn Fn(String) -> GeneratorBlock>);

impl FromStr for Generator {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "bookmark" {
            Ok(Generator(Box::new(GeneratorBlock::new_bookmark)))
        } else if s == "quote" {
            Ok(Generator(Box::new(GeneratorBlock::new_quote)))
        } else {
            Err(())
        }
    }
}

struct Writer<'a, I> {
    tokens: I,
    output: Vec<VNode>,
    stack: Vec<VNode>,
    footnotes: HashMap<CowStr<'a>, usize>,
    table_align: Vec<Alignment>,
    table_head: bool,
    table_colidx: usize,
}

impl<'a, I> Writer<'a, I>
where
    I: Iterator<Item = Event<'a>>,
{
    fn new(tokens: I) -> Self {
        Self {
            tokens,
            output: Vec::new(),
            stack: Vec::new(),
            footnotes: HashMap::new(),
            table_align: Vec::new(),
            table_head: false,
            table_colidx: 0,
        }
    }

    fn pop(&mut self) -> VNode {
        self.stack.pop().unwrap_or_else(|| {
            panic!("Stack underflow");
        })
    }

    fn output(&mut self, node: VNode) {
        if let Some(VNode::VTag(top)) = self.stack.last_mut() {
            top.add_child(node);
        } else {
            self.output.push(node);
        }
    }

    fn start_tag(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => self.stack.push(VTag::new("p").into()),

            Tag::Heading(level, ident, classes) => {
                let mut tag = VTag::new(match level {
                    HeadingLevel::H1 => "h1",
                    HeadingLevel::H2 => "h2",
                    HeadingLevel::H3 => "h3",
                    HeadingLevel::H4 => "h4",
                    HeadingLevel::H5 => "h5",
                    HeadingLevel::H6 => "h6",
                });

                if let Some(ident) = ident {
                    tag.add_attribute("id", ident.to_string());
                }

                if !classes.is_empty() {
                    tag.add_attribute("class", classes.join(" "));
                }

                self.stack.push(tag.into());
            }

            Tag::BlockQuote => self.stack.push(VTag::new("blockquote").into()),

            Tag::CodeBlock(kind) => {
                if let CodeBlockKind::Fenced(language) = &kind {
                    if let Ok(generator) = language.parse::<Generator>() {
                        if let Ok(content) = self.raw_text() {
                            self.output((generator.0)(content).generate());
                            return;
                        }
                    }
                }

                if let Ok(content) = self.raw_text() {
                    let mut figure = VTag::new("figure");
                    figure.add_attribute("class", "code");

                    let mut pre = VTag::new("pre");
                    let mut code = VTag::new("code");

                    let properties = if let CodeBlockKind::Fenced(language) = kind {
                        if !language.is_empty() {
                            let (language, properties) = parse_language_properties(&language)
                                .expect("valid language and properties");

                            code.add_attribute("class", format!("lang-{language}"));
                            Some(properties)
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                    .unwrap_or_default();

                    code.add_child(VText::new(content).into());

                    pre.add_child(code.into());
                    figure.add_child(pre.into());

                    if properties.has("caption") {
                        let mut figcap = VTag::new("figcaption");
                        figcap.add_child(
                            VText::new(
                                properties
                                    .get("caption")
                                    .map(ToString::to_string)
                                    .unwrap_or_default(),
                            )
                            .into(),
                        );
                        figure.add_child(figcap.into());
                    }

                    self.output(figure.into());
                } else {
                    self.stack.push(VTag::new("pre").into());
                }
            }

            Tag::List(ordered) => {
                let mut tag = VTag::new(if ordered.is_some() { "ol" } else { "ul" });
                if let Some(start) = ordered {
                    tag.add_attribute("start", start.to_string());
                }

                self.stack.push(tag.into());
            }

            Tag::Item => self.stack.push(VTag::new("li").into()),

            Tag::FootnoteDefinition(_) => todo!(),

            Tag::Table(align) => {
                self.table_align = align;
                self.stack.push(VTag::new("table").into());
            }

            Tag::TableHead => {
                self.table_head = true;
                self.stack.push(VTag::new("thead").into());
                self.stack.push(VTag::new("tr").into());
            }

            Tag::TableRow => {
                self.table_colidx = 0;
                self.stack.push(VTag::new("tr").into());
            }
            Tag::TableCell => {
                let mut cell = if self.table_head {
                    VTag::new("th")
                } else {
                    VTag::new("td")
                };

                match self.table_align.get(self.table_colidx) {
                    Some(&Alignment::Left) => {
                        cell.add_attribute("class", "left");
                    }
                    Some(&Alignment::Right) => {
                        cell.add_attribute("class", "right");
                    }
                    Some(&Alignment::Center) => cell.add_attribute("class", "center"),
                    _ => {}
                }

                self.stack.push(cell.into());
            }

            Tag::Emphasis => self.stack.push(VTag::new("em").into()),
            Tag::Strong => self.stack.push(VTag::new("strong").into()),
            Tag::Strikethrough => self.stack.push(VTag::new("s").into()),

            Tag::Link(_, href, title) => {
                let mut anchor = VTag::new("a");
                anchor.add_attribute("href", href.to_string());
                anchor.add_attribute("title", title.to_string());
                self.stack.push(anchor.into());
            }

            Tag::Image(_, href, title) => {
                // Note that we do not get an `Event::End` for the image tag.
                let mut img = VTag::new("img");
                img.add_attribute("loading", "lazy");
                img.add_attribute("src", href.to_string());
                img.add_attribute("title", title.to_string());

                let alt = if let Ok(alt) = self.raw_text() {
                    img.add_attribute("alt", alt.clone());
                    Some(alt)
                } else {
                    None
                };

                // If the currently open tag is a <p> tag, then we want to replace it with a
                // <figure>. If not, we'll add our own <figure> tag.

                let top_p = self
                    .stack
                    .last()
                    .map(|top| match top {
                        VNode::VTag(tag) => tag.tag() == "p",
                        _ => false,
                    })
                    .unwrap_or_default();
                if top_p {
                    self.stack.pop();
                }

                let mut figure = VTag::new("figure");
                figure.add_child(img.into());

                if let Some(alt) = alt {
                    let mut caption = VTag::new("figcaption");
                    caption.add_child(VText::new(alt).into());
                    figure.add_child(caption.into());
                }

                // Put the <figure> onto the stack. This will be popped by the `Event::End` for the
                // `<p>` tag that Markdown likes to wrap around images.
                self.stack.push(figure.into());
            }
        }
    }

    fn end_tag(&mut self, tag: Tag) {
        match tag {
            Tag::Table(_) => {
                // Pop the <tbody> and then the <table>
                let tbody = self.pop();
                self.output(tbody);
                let table = self.pop();
                self.output(table);
            }
            Tag::TableHead => {
                // Pop the <tr>, the <thead>, and then enter the <tbody>.
                let row = self.pop();
                self.output(row);
                let thead = self.pop();
                self.output(thead);

                self.table_head = false;
                self.stack.push(VTag::new("tbody").into());
            }
            Tag::TableCell => {
                let cell = self.pop();
                self.output(cell);
                self.table_colidx += 1;
            }
            _ => {
                let element = self.pop();
                self.output(element);
            }
        }
    }

    fn raw_text(&mut self) -> Result<String, std::fmt::Error> {
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

                Event::Html(text) | Event::Code(text) | Event::Text(text) => {
                    write!(&mut output, "{text}")?
                }

                Event::SoftBreak | Event::HardBreak | Event::Rule => write!(&mut output, " ")?,

                Event::FootnoteReference(name) => {
                    let next = self.footnotes.len() + 1;
                    let footnote = *self.footnotes.entry(name).or_insert(next);
                    write!(&mut output, "[{footnote}]")?;
                }

                Event::TaskListMarker(true) => write!(&mut output, "[x]")?,
                Event::TaskListMarker(false) => write!(&mut output, "[ ]")?,
            }
        }

        Ok(output)
    }

    fn run(mut self) -> Html {
        while let Some(event) = self.tokens.next() {
            match event {
                Event::Start(tag) => self.start_tag(tag),
                Event::End(tag) => self.end_tag(tag),
                Event::Text(text) => self.output(VText::new(text.to_string()).into()),

                Event::Code(text) => {
                    let text = VText::new(text.to_string());
                    let mut code = VTag::new("code");
                    code.add_child(text.into());
                    self.output(code.into());
                }

                Event::Html(_) => {
                    log::info!("Ignoring html: {event:?}")
                }

                Event::FootnoteReference(_) => todo!(),

                Event::SoftBreak => self.output(VText::new("\n").into()),
                Event::HardBreak => {}
                Event::Rule => {}
                Event::TaskListMarker(_) => todo!(),
            }
        }

        debug_assert!(
            self.stack.is_empty(),
            "Stack is not empty: {:?}",
            self.stack
        );

        VList::with_children(self.output, None).into()
    }
}

pub fn markdown(content: &str) -> Html {
    let parser = Parser::new_ext(content, Options::all());
    Writer::new(parser).run()
}
