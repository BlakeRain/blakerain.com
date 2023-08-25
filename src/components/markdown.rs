use std::{collections::HashMap, fmt::Write, str::FromStr};

use gray_matter::engine::Engine;
use pulldown_cmark::{CodeBlockKind, CowStr, Event, HeadingLevel, Options, Parser, Tag};
use serde::Deserialize;
use yew::{
    html,
    virtual_dom::{VList, VNode, VTag, VText},
    Html,
};

#[derive(Deserialize)]
struct BookmarkDecl {
    url: String,
    title: String,
    description: String,
    author: String,
    publisher: Option<String>,
    thumbnail: Option<String>,
    icon: Option<String>,
}

impl BookmarkDecl {
    fn generate(self) -> VNode {
        html! {
            <figure>
                <a href={self.url}>
                    <div>
                        <h1>{self.title}</h1>
                    </div>
                </a>
            </figure>
        }
    }
}

enum GeneratorBlock {
    Bookmark(BookmarkDecl),
}

impl GeneratorBlock {
    fn new_bookmark(content: String) -> Self {
        let decl = gray_matter::engine::YAML::parse(&content)
            .deserialize()
            .expect("BookmarkDecl");
        Self::Bookmark(decl)
    }

    fn generate(self) -> VNode {
        match self {
            Self::Bookmark(decl) => decl.generate(),
        }
    }
}

struct Generator(pub Box<dyn Fn(String) -> GeneratorBlock>);

impl FromStr for Generator {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        if s == "bookmark" {
            Ok(Generator(Box::new(GeneratorBlock::new_bookmark)))
        } else {
            Err(())
        }
    }
}

struct Writer<'a, I> {
    tokens: I,
    output: Vec<VNode>,
    stack: Vec<VTag>,
    footnotes: HashMap<CowStr<'a>, usize>,
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
        }
    }

    fn start_tag(&mut self, tag: Tag) {
        match tag {
            Tag::Paragraph => self.stack.push(VTag::new("p")),

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

                self.stack.push(tag);
            }

            Tag::BlockQuote => self.stack.push(VTag::new("blockquote")),

            Tag::CodeBlock(kind) => {
                if let CodeBlockKind::Fenced(language) = &kind {
                    if let Ok(generator) = language.parse::<Generator>() {
                        if let Ok(content) = self.raw_text() {
                            let block = (generator.0)(content);
                            let tag = block.generate();
                            self.stack.push(tag);
                            return;
                        }
                    }
                }

                let mut pre = VTag::new("pre");
                let mut code = VTag::new("code");
                if let CodeBlockKind::Fenced(language) = kind {
                    if !language.is_empty() {
                        code.add_attribute("class", format!("lang-{language}"));
                    }
                }

                pre.add_child(code.into());
                self.stack.push(pre);
            }

            Tag::List(ordered) => {
                let mut tag = VTag::new(if ordered.is_some() { "ol" } else { "ul" });
                if let Some(start) = ordered {
                    tag.add_attribute("start", start.to_string());
                }

                self.stack.push(tag);
            }

            Tag::Item => self.stack.push(VTag::new("li")),
            Tag::FootnoteDefinition(_) => todo!(),
            Tag::Table(_) => todo!(),
            Tag::TableHead => todo!(),
            Tag::TableRow => todo!(),
            Tag::TableCell => todo!(),
            Tag::Emphasis => self.stack.push(VTag::new("em")),
            Tag::Strong => self.stack.push(VTag::new("strong")),
            Tag::Strikethrough => self.stack.push(VTag::new("s")),

            Tag::Link(_, href, title) => {
                let mut anchor = VTag::new("a");
                anchor.add_attribute("href", href.to_string());
                anchor.add_attribute("title", title.to_string());
                self.stack.push(anchor);
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
                    .map(|top| top.tag() == "p")
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
                self.stack.push(figure);
            }
        }
    }

    fn end_tag(&mut self, tag: Tag) {
        let element = self
            .stack
            .pop()
            .unwrap_or_else(|| {
                panic!("Expected stack to have an element at end of tag: {tag:?}");
            })
            .into();

        if let Some(top) = self.stack.last_mut() {
            top.add_child(element);
        } else {
            self.output.push(element);
        }
    }

    fn raw_text(&mut self) -> Result<String, std::fmt::Error> {
        let mut output = String::new();
        let mut nest = 0;

        for event in self.tokens.by_ref() {
            match event {
                Event::Start(_) => nest += 1,
                Event::End(tag) => {
                    log::info!("raw_text event.end: {tag:?}");
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
            log::info!("{event:?}");

            match event {
                Event::Start(tag) => self.start_tag(tag),
                Event::End(tag) => self.end_tag(tag),

                Event::Text(text) => {
                    if let Some(top) = self.stack.last_mut() {
                        let text = VText::new(text.to_string());
                        top.add_child(text.into());
                    }
                }

                Event::Code(text) => {
                    if let Some(top) = self.stack.last_mut() {
                        let text = VText::new(text.to_string());
                        let mut code = VTag::new("code");
                        code.add_child(text.into());
                        top.add_child(code.into());
                    }
                }

                Event::Html(_) => {
                    log::info!("Ignoring html: {event:?}")
                }
                Event::FootnoteReference(_) => todo!(),

                Event::SoftBreak => {
                    if let Some(top) = self.stack.last_mut() {
                        let text = VText::new("\n");
                        top.add_child(text.into());
                    }
                }

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
