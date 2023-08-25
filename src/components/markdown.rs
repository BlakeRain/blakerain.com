use std::{collections::HashMap, fmt::Write};

use pulldown_cmark::{CodeBlockKind, CowStr, Event, HeadingLevel, Options, Parser, Tag};
use yew::{
    virtual_dom::{VList, VNode, VTag, VText},
    Html,
};

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
                let mut tag = VTag::new("a");
                tag.add_attribute("href", href.to_string());
                tag.add_attribute("title", title.to_string());
                self.stack.push(tag);
            }

            Tag::Image(_, href, title) => {
                let mut tag = VTag::new("img");
                tag.add_attribute("src", href.to_string());
                tag.add_attribute("title", title.to_string());
                if let Ok(alt) = self.raw_text() {
                    tag.add_attribute("alt", alt);
                }
                self.stack.push(tag);
            }
        }
    }

    fn end_tag(&mut self, tag: Tag) {
        let top = self.stack.pop().unwrap_or_else(|| {
            panic!("Expected stack to have an element at end of tag: {tag:?}");
        });

        self.output.push(top.into());
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
                Event::SoftBreak => {}
                Event::HardBreak => {}
                Event::Rule => {}
                Event::TaskListMarker(_) => todo!(),
            }
        }

        // debug_assert!(
        //     self.stack.is_empty(),
        //     "Stack is not empty: {:?}",
        //     self.stack
        // );

        VList::with_children(self.output, None).into()
    }
}

pub fn markdown(content: &str) -> Html {
    let parser = Parser::new_ext(content, Options::all());
    Writer::new(parser).run()
}
