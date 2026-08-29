use std::{
    collections::{HashMap, VecDeque},
    ops::Range,
};

use anyhow::Context;
use minijinja::{Environment, Template, Value};
use pulldown_cmark::{Alignment, BlockQuoteKind, Event, HeadingLevel, LinkType, Tag, TagEnd};
use pulldown_cmark_escape::{FmtWriter, StrWrite, escape_html, escape_html_body_text};
use serde::Serialize;

use crate::{
    parse::{AttributeValue, CodeBlockSpec},
    pikchr, syntax,
};

fn map_alignment(alignment: Alignment) -> Value {
    match alignment {
        Alignment::None => Value::UNDEFINED,
        Alignment::Left => Value::from("left"),
        Alignment::Center => Value::from("center"),
        Alignment::Right => Value::from("right"),
    }
}

fn map_blockquote_kind(kind: Option<BlockQuoteKind>) -> Value {
    let Some(kind) = kind else {
        return Value::UNDEFINED;
    };

    match kind {
        BlockQuoteKind::Note => Value::from("note"),
        BlockQuoteKind::Tip => Value::from("tip"),
        BlockQuoteKind::Important => Value::from("important"),
        BlockQuoteKind::Warning => Value::from("warning"),
        BlockQuoteKind::Caution => Value::from("caution"),
    }
}

fn map_link_type(type_: LinkType) -> Value {
    match type_ {
        LinkType::Inline => Value::from("inline"),
        LinkType::Reference => Value::from("reference"),
        LinkType::ReferenceUnknown => Value::from("reference-unknown"),
        LinkType::Collapsed => Value::from("collapsed"),
        LinkType::CollapsedUnknown => Value::from("collapsed-unknown"),
        LinkType::Shortcut => Value::from("shortcut"),
        LinkType::ShortcutUnknown => Value::from("shortcut-unknown"),
        LinkType::Autolink => Value::from("autolink"),
        LinkType::Email => Value::from("email"),
        LinkType::WikiLink { .. } => Value::from("wikilink"),
    }
}

const TEMPLATE_PATH_PARAGRAPH: &str = "markdown/paragraph.html";
const TEMPLATE_PATH_HEADING: &str = "markdown/heading.html";
const TEMPLATE_PATH_TABLE: &str = "markdown/table.html";
const TEMPLATE_PATH_BLOCKQUOTE: &str = "markdown/blockquote.html";
const TEMPLATE_PATH_CODEBLOCK: &str = "markdown/codeblock.html";
const TEMPLATE_PATH_LIST: &str = "markdown/list.html";
const TEMPLATE_PATH_DEFINITIONS: &str = "markdown/definitions.html";
const TEMPLATE_PATH_LINK: &str = "markdown/link.html";
const TEMPLATE_PATH_IMAGE: &str = "markdown/image.html";
const TEMPLATE_PATH_FOOTNOTE: &str = "markdown/footnote.html";
const TEMPLATE_PATH_PIKCHR: &str = "markdown/pikchr.html";

const TEMPLATE_PATHS: &[&str] = &[
    TEMPLATE_PATH_PARAGRAPH,
    TEMPLATE_PATH_HEADING,
    TEMPLATE_PATH_TABLE,
    TEMPLATE_PATH_BLOCKQUOTE,
    TEMPLATE_PATH_CODEBLOCK,
    TEMPLATE_PATH_LIST,
    TEMPLATE_PATH_DEFINITIONS,
    TEMPLATE_PATH_LINK,
    TEMPLATE_PATH_IMAGE,
    TEMPLATE_PATH_FOOTNOTE,
    TEMPLATE_PATH_PIKCHR,
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum TableMode {
    Begin,
    Head,
    Body,
}

#[derive(Debug, Serialize)]
struct TableState {
    #[serde(skip)]
    mode: TableMode,
    alignments: Vec<Value>,
    headings: Vec<String>,
    rows: Vec<Vec<String>>,
}

impl TableState {
    fn new(alignments: Vec<Value>) -> Self {
        Self {
            mode: TableMode::Begin,
            alignments,
            headings: Vec::new(),
            rows: Vec::new(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum CodeBlockInfo {
    Indented,
    Fenced {
        info: String,
        language: Option<String>,
        attributes: HashMap<String, AttributeValue>,
    },
}

impl CodeBlockInfo {
    fn is_html(&self) -> bool {
        matches!(self, Self::Fenced { language: Some(language), .. } if language == "html")
    }
}

impl TryFrom<pulldown_cmark::CodeBlockKind<'_>> for CodeBlockInfo {
    type Error = anyhow::Error;

    fn try_from(kind: pulldown_cmark::CodeBlockKind) -> Result<Self, Self::Error> {
        match kind {
            pulldown_cmark::CodeBlockKind::Indented => Ok(Self::Indented),
            pulldown_cmark::CodeBlockKind::Fenced(info) => {
                let info = String::from(info);
                let (
                    _,
                    CodeBlockSpec {
                        language,
                        attributes,
                    },
                ) = CodeBlockSpec::parse(&info).map_err(|err| {
                    tracing::error!(
                        ?err,
                        "failed to parse code block attributes in fenced code block"
                    );

                    anyhow::anyhow!("failed to parse code block attributes")
                })?;

                Ok(Self::Fenced {
                    info,
                    language,
                    attributes,
                })
            }
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum RenderCxt {
    Paragraph,
    Heading {
        level: u32,
        id: Option<String>,
        classes: Vec<String>,
        attributes: HashMap<String, Option<String>>,
    },
    Table {
        #[serde(flatten)]
        state: TableState,
    },
    BlockQuote {
        kind: Value,
    },
    CodeBlock {
        #[serde(flatten)]
        info: CodeBlockInfo,
    },
    List {
        start: Option<u64>,
        items: Vec<String>,
    },
    Definitions {
        definitions: Vec<(String, String)>,
    },
    Link {
        kind: Value,
        dest_url: String,
        title: String,
        id: String,
        has_pothole: bool,
    },
    Image {
        dest_url: String,
        title: String,
    },
    FootnoteDefinition {
        name: String,
        index: usize,
    },
}

impl RenderCxt {
    fn get_template_path(&self) -> &'static str {
        match self {
            Self::Paragraph => TEMPLATE_PATH_PARAGRAPH,
            Self::Heading { .. } => TEMPLATE_PATH_HEADING,
            Self::Table { .. } => TEMPLATE_PATH_TABLE,
            Self::BlockQuote { .. } => TEMPLATE_PATH_BLOCKQUOTE,
            Self::CodeBlock { .. } => TEMPLATE_PATH_CODEBLOCK,
            Self::List { .. } => TEMPLATE_PATH_LIST,
            Self::Definitions { .. } => TEMPLATE_PATH_DEFINITIONS,
            Self::Link { .. } => TEMPLATE_PATH_LINK,
            Self::Image { .. } => TEMPLATE_PATH_IMAGE,
            Self::FootnoteDefinition { .. } => TEMPLATE_PATH_FOOTNOTE,
        }
    }
}

enum SummaryState {
    Writing(FmtWriter<String>),
    Finished(String),
}

#[derive(Serialize)]
pub struct Outline {
    #[serde(skip)]
    level: u32,
    id: Option<String>,
    title: String,
    children: Vec<Outline>,
}

#[derive(Default)]
pub struct OutlineBuilder {
    outline: Vec<Outline>,
}

impl OutlineBuilder {
    pub fn add_heading(&mut self, level: u32, id: Option<String>, title: String) {
        self.outline.push(Outline {
            level,
            id,
            title,
            children: Vec::new(),
        });
    }

    pub fn finish(self) -> Vec<Outline> {
        let mut iter = self.outline.into_iter().peekable();
        let mut root = Vec::new();

        while let Some(level) = iter.peek().map(|node| node.level) {
            let mut node = iter.next().expect("peeked heading");
            build_children(level, &mut iter, &mut node.children);
            root.push(node);
        }

        root
    }
}

fn build_children(
    parent_level: u32,
    iter: &mut std::iter::Peekable<std::vec::IntoIter<Outline>>,
    out: &mut Vec<Outline>,
) {
    while let Some(level) = iter.peek().map(|node| node.level) {
        if level <= parent_level {
            return;
        }

        let mut node = iter.next().expect("peeked heading");
        build_children(level, iter, &mut node.children);
        out.push(node);
    }
}

struct State<'t> {
    templates: &'t Environment<'t>,
    tcache: HashMap<&'static str, Template<'t, 't>>,
    stack: VecDeque<(FmtWriter<String>, RenderCxt)>,
    footnotes: HashMap<String, usize>,
    outline: OutlineBuilder,
    heading_text: Option<String>,
    in_code_block: bool,
    word_count: usize,
    summary_text: SummaryState,
    summary_html: Option<String>,
    base: String,
    writer: FmtWriter<String>,
}

impl<'t> State<'t> {
    fn new(templates: &'t Environment<'t>, base: &str) -> anyhow::Result<Self> {
        let mut tcache = HashMap::new();
        for path in TEMPLATE_PATHS {
            tcache.insert(
                *path,
                templates
                    .get_template(path)
                    .context("failed to load template")?,
            );
        }

        Ok(Self {
            templates,
            tcache,
            stack: VecDeque::new(),
            outline: OutlineBuilder::default(),
            heading_text: None,
            in_code_block: false,
            word_count: 0,
            footnotes: HashMap::new(),
            summary_text: SummaryState::Writing(FmtWriter(String::new())),
            summary_html: None,
            base: String::from(base),
            writer: FmtWriter(String::new()),
        })
    }

    fn get_template(&self, path: &'static str) -> anyhow::Result<Template<'t, 't>> {
        if let Some(template) = self.tcache.get(path) {
            return Ok(template.clone());
        } else {
            self.templates
                .get_template(path)
                .context("failed to load template")
        }
    }

    fn write(&mut self, text: &str) -> anyhow::Result<()> {
        self.writer.write_str(text)?;

        if let SummaryState::Writing(writer) = &mut self.summary_text {
            writer.write_str(text)?;
        }

        Ok(())
    }

    fn write_escaped(&mut self, text: &str) -> anyhow::Result<()> {
        escape_html(&mut self.writer, text)?;

        if let SummaryState::Writing(writer) = &mut self.summary_text {
            escape_html(writer, text)?;
        }

        Ok(())
    }

    fn write_escaped_body_text(&mut self, text: &str) -> anyhow::Result<()> {
        escape_html_body_text(&mut self.writer, text)?;

        if let SummaryState::Writing(writer) = &mut self.summary_text {
            escape_html_body_text(writer, text)?;
        }

        Ok(())
    }

    fn finish_summary_text(&mut self) {
        if let SummaryState::Writing(writer) = &mut self.summary_text {
            let content = writer.0.trim();
            self.summary_text = SummaryState::Finished(String::from(content));
        }
    }

    fn append_heading_text(&mut self, text: &str) {
        if let Some(heading) = &mut self.heading_text {
            heading.push_str(text);
        }
    }

    fn process_image(&self, dest_url: String) -> anyhow::Result<String> {
        if dest_url.starts_with("http://")
            || dest_url.starts_with("https://")
            || dest_url.starts_with('/')
            || dest_url.starts_with('#')
            || dest_url.starts_with("data:")
        {
            return Ok(dest_url);
        }

        crate::images::process(&self.base, &dest_url, &crate::images::ImageSpec::default())
    }

    fn take_summary_text(&mut self) -> Option<String> {
        let mut summary = SummaryState::Writing(FmtWriter(String::new()));
        std::mem::swap(&mut self.summary_text, &mut summary);

        let summary = match summary {
            SummaryState::Writing(writer) => writer.0,
            SummaryState::Finished(content) => content,
        };

        if summary.is_empty() {
            None
        } else {
            Some(summary)
        }
    }

    fn take_content(&mut self) -> String {
        let mut writer = FmtWriter(String::new());
        std::mem::swap(&mut self.writer, &mut writer);
        writer.0
    }

    fn push(&mut self, writer: FmtWriter<String>, cxt: RenderCxt) {
        self.stack.push_back((writer, cxt));
    }

    fn pop(&mut self) -> anyhow::Result<(FmtWriter<String>, RenderCxt)> {
        self.stack.pop_back().context("stack underflow")
    }

    fn peek(&mut self) -> anyhow::Result<&(FmtWriter<String>, RenderCxt)> {
        self.stack.back().context("stack underflow")
    }

    fn enter(&mut self, context: RenderCxt) {
        let mut writer = FmtWriter(String::new());
        std::mem::swap(&mut self.writer, &mut writer);
        self.stack.push_back((writer, context));
    }

    fn leave(&mut self) -> anyhow::Result<String> {
        let (mut writer, context) = self.stack.pop_back().context("stack underflow")?;

        let template_path = context.get_template_path();
        let template = self
            .get_template(template_path)
            .with_context(|| format!("failed to load template '{}'", template_path))?;

        std::mem::swap(&mut self.writer, &mut writer);

        template
            .render(minijinja::context! {
                content => writer.0,
                ..Value::from_serialize(&context)
            })
            .with_context(|| format!("failed to render template '{}'", template_path))
    }

    fn start_tag(&mut self, tag: Tag) -> anyhow::Result<()> {
        match tag {
            Tag::HtmlBlock => {}

            Tag::Paragraph => {
                self.enter(RenderCxt::Paragraph);
            }

            Tag::Heading {
                level,
                id,
                classes,
                attrs,
            } => {
                let level = match level {
                    HeadingLevel::H1 => 1,
                    HeadingLevel::H2 => 2,
                    HeadingLevel::H3 => 3,
                    HeadingLevel::H4 => 4,
                    HeadingLevel::H5 => 5,
                    HeadingLevel::H6 => 6,
                };

                let id = id.map(String::from);
                let classes = classes.into_iter().map(String::from).collect::<Vec<_>>();
                let attributes = attrs
                    .into_iter()
                    .map(|(k, v)| (String::from(k), v.map(String::from)))
                    .collect::<HashMap<_, _>>();

                self.heading_text = Some(String::new());

                self.enter(RenderCxt::Heading {
                    level,
                    id,
                    classes,
                    attributes,
                })
            }

            Tag::Table(alignments) => {
                let alignments = alignments
                    .into_iter()
                    .map(map_alignment)
                    .collect::<Vec<_>>();

                let state = TableState::new(alignments);
                self.enter(RenderCxt::Table { state });
            }

            Tag::TableHead => {
                let (writer, RenderCxt::Table { mut state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                if state.mode != TableMode::Begin {
                    return Err(anyhow::anyhow!(
                        "table context in invalid state {:?}; expected Begin",
                        state.mode
                    ));
                }

                state.mode = TableMode::Head;
                self.push(writer, RenderCxt::Table { state });
            }

            Tag::TableRow => {
                let (writer, RenderCxt::Table { mut state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                if state.mode != TableMode::Body {
                    return Err(anyhow::anyhow!(
                        "table context in invalid state {:?}; expected Body",
                        state.mode
                    ));
                }

                state.rows.push(Vec::new());
                self.push(writer, RenderCxt::Table { state });
            }

            Tag::TableCell => {
                let (writer, RenderCxt::Table { state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                if state.mode == TableMode::Begin {
                    return Err(anyhow::anyhow!(
                        "table context in invalid state {:?}; expected Head or Body",
                        state.mode
                    ));
                }

                self.push(writer, RenderCxt::Table { state });
            }

            Tag::BlockQuote(kind) => {
                let kind = map_blockquote_kind(kind);
                self.enter(RenderCxt::BlockQuote { kind });
            }

            Tag::CodeBlock(info) => {
                let info = CodeBlockInfo::try_from(info)?;
                self.in_code_block = true;
                self.enter(RenderCxt::CodeBlock { info });
            }

            Tag::List(start) => self.enter(RenderCxt::List {
                start,
                items: Vec::new(),
            }),

            Tag::Item => {
                let (_, RenderCxt::List { .. }) = self.peek()? else {
                    return Err(anyhow::anyhow!("expected list context"));
                };
            }

            Tag::DefinitionList => self.enter(RenderCxt::Definitions {
                definitions: Vec::new(),
            }),

            Tag::DefinitionListTitle | Tag::DefinitionListDefinition => {
                let (_, RenderCxt::Definitions { .. }) = self.peek()? else {
                    return Err(anyhow::anyhow!("expected definition list context"));
                };
            }

            Tag::Subscript => self.write("<sub>")?,
            Tag::Superscript => self.write("<sup>")?,
            Tag::Emphasis => self.write("<em>")?,
            Tag::Strong => self.write("<strong>")?,
            Tag::Strikethrough => self.write("<del>")?,

            Tag::Link {
                link_type,
                dest_url,
                title,
                id,
            } => {
                let kind = map_link_type(link_type);
                let has_pothole = matches!(link_type, LinkType::WikiLink { has_pothole: true });
                let dest_url = String::from(dest_url);
                let title = String::from(title);
                let id = String::from(id);

                self.enter(RenderCxt::Link {
                    kind,
                    dest_url,
                    title,
                    id,
                    has_pothole,
                })
            }

            Tag::Image {
                dest_url, title, ..
            } => {
                let dest_url = String::from(dest_url);
                let title = String::from(title);

                let dest_url = self.process_image(dest_url)?;

                self.enter(RenderCxt::Image { dest_url, title })
            }

            Tag::FootnoteDefinition(name) => {
                let name = String::from(name);
                let next = 1 + self.footnotes.len();
                let index = *self.footnotes.entry(name.clone()).or_insert(next);
                self.enter(RenderCxt::FootnoteDefinition { name, index })
            }

            _ => {
                tracing::warn!("unhandled tag: {:?}", tag);
            }
        }

        Ok(())
    }

    fn end_tag(&mut self, tag: TagEnd) -> anyhow::Result<()> {
        match tag {
            TagEnd::HtmlBlock => {}

            TagEnd::Paragraph => {
                self.finish_summary_text();

                let content = self
                    .leave()
                    .with_context(|| "failed to leave context for {tag:?}")?;

                if self.summary_html.is_none() {
                    self.summary_html = Some(content.trim().to_string());
                }

                self.writer.write_str(&content)?;
            }

            TagEnd::Heading(_) => {
                let (
                    mut writer,
                    RenderCxt::Heading {
                        level,
                        id,
                        classes,
                        attributes,
                    },
                ) = self.pop()?
                else {
                    return Err(anyhow::anyhow!("expected heading context"));
                };

                std::mem::swap(&mut self.writer, &mut writer);
                let content = writer.0;

                let id = if id.is_none() {
                    Some(
                        content
                            .trim()
                            .chars()
                            .map(|c| c.to_lowercase())
                            .flatten()
                            .filter_map(|c| match c {
                                'a'..='z' | '0'..='9' | '-' | '_' => Some(c),
                                ' ' => Some('-'),
                                _ => None,
                            })
                            .collect::<String>(),
                    )
                } else {
                    id
                };

                let title = self.heading_text.take().unwrap_or_default();
                self.outline.add_heading(level, id.clone(), title);

                let context = RenderCxt::Heading {
                    level,
                    id,
                    classes,
                    attributes,
                };

                let template_path = context.get_template_path();
                let template = self
                    .get_template(template_path)
                    .with_context(|| format!("failed to load template {template_path:?}"))?;

                let output = template
                    .render(minijinja::context! {
                        content,
                        ..Value::from_serialize(&context)
                    })
                    .with_context(|| format!("failed to render template {template_path:?}"))?;

                self.writer.write_str(&output)?;
            }

            TagEnd::TableHead => {
                let (writer, RenderCxt::Table { mut state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                if state.mode != TableMode::Head {
                    return Err(anyhow::anyhow!(
                        "table context in invalid state {:?}; expected Head",
                        state.mode
                    ));
                }

                state.mode = TableMode::Body;
                self.push(writer, RenderCxt::Table { state });
            }

            TagEnd::TableRow => {
                let (writer, RenderCxt::Table { state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                if state.mode != TableMode::Body {
                    return Err(anyhow::anyhow!(
                        "table context in invalid state {:?}; expected Body",
                        state.mode
                    ));
                }

                self.push(writer, RenderCxt::Table { state });
            }

            TagEnd::TableCell => {
                let (writer, RenderCxt::Table { mut state }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected table context"));
                };

                let content = self.take_content();

                match state.mode {
                    TableMode::Begin => {
                        anyhow::bail!(
                            "table cell in invalid state {:?}; expected Head or Body",
                            state.mode
                        );
                    }

                    TableMode::Head => {
                        state.headings.push(content);
                    }

                    TableMode::Body => {
                        let row = state.rows.last_mut().context("no row")?;
                        row.push(content);
                    }
                }

                self.push(writer, RenderCxt::Table { state });
            }

            TagEnd::Item => {
                let (writer, RenderCxt::List { start, mut items }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected list context"));
                };

                items.push(self.take_content());
                self.push(writer, RenderCxt::List { start, items });
            }

            TagEnd::DefinitionListTitle => {
                let (writer, RenderCxt::Definitions { mut definitions }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected definition list context"));
                };

                definitions.push((self.take_content(), String::new()));
                self.push(writer, RenderCxt::Definitions { definitions });
            }

            TagEnd::DefinitionListDefinition => {
                let (writer, RenderCxt::Definitions { mut definitions }) = self.pop()? else {
                    return Err(anyhow::anyhow!("expected definition list context"));
                };

                let definition = definitions
                    .last_mut()
                    .context("no definition title before definition")?;
                definition.1 = self.take_content();

                self.push(writer, RenderCxt::Definitions { definitions });
            }

            TagEnd::Subscript => self.write("</sub>")?,
            TagEnd::Superscript => self.write("</sup>")?,
            TagEnd::Emphasis => self.write("</em>")?,
            TagEnd::Strong => self.write("</strong>")?,
            TagEnd::Strikethrough => self.write("</del>")?,

            TagEnd::CodeBlock => {
                self.in_code_block = false;

                let (mut writer, context) = self.pop()?;
                let RenderCxt::CodeBlock { info } = context else {
                    return Err(anyhow::anyhow!("expected code block context"));
                };

                std::mem::swap(&mut self.writer, &mut writer);
                let raw = writer.0;

                if let CodeBlockInfo::Fenced {
                    language: Some(language),
                    attributes,
                    ..
                } = &info
                    && language == "pikchr"
                {
                    let light_image = pikchr::Image::render(&raw, None, pikchr::Options::default())
                        .context("failed to render pikchr image")?;

                    let dark_image = pikchr::Image::render(
                        &raw,
                        None,
                        pikchr::Options::default().set_dark_mode(true),
                    )
                    .context("failed to render pikchr image")?;

                    let template = self
                        .get_template(TEMPLATE_PATH_PIKCHR)
                        .context("failed to load pikchr template")?;

                    let output = template
                        .render(minijinja::context! {
                            light_image => *light_image,
                            dark_image => *dark_image,
                            width => light_image.width,
                            height => light_image.height,
                            attributes => &attributes,
                            ..Value::from_serialize(&info)
                        })
                        .context("failed to render codeblock template")?;

                    self.writer.write_str(&output)?;
                } else {
                    let (content, attributes) = match &info {
                        CodeBlockInfo::Fenced { attributes, .. } if info.is_html() => {
                            (raw, attributes)
                        }

                        CodeBlockInfo::Fenced {
                            language: Some(language),
                            attributes,
                            ..
                        } => (syntax::highlight(&raw, language), attributes),

                        CodeBlockInfo::Fenced { .. } | CodeBlockInfo::Indented => {
                            let mut buf = FmtWriter(String::new());
                            escape_html(&mut buf, &raw)?;
                            (buf.0, &HashMap::new())
                        }
                    };

                    let template = self
                        .get_template(TEMPLATE_PATH_CODEBLOCK)
                        .context("failed to load codeblock template")?;

                    let output = template
                        .render(minijinja::context! {
                            content,
                            attributes,
                            ..Value::from_serialize(&info)
                        })
                        .context("failed to render codeblock template")?;

                    self.writer.write_str(&output)?;
                }
            }

            TagEnd::Table
            | TagEnd::BlockQuote(_)
            | TagEnd::List(_)
            | TagEnd::DefinitionList
            | TagEnd::Link
            | TagEnd::Image
            | TagEnd::FootnoteDefinition => {
                let content = self
                    .leave()
                    .with_context(|| format!("failed to leave context for {tag:?}"))?;
                self.writer.write_str(&content)?;
            }

            _ => {
                tracing::warn!("unhandked end tag: {:?}", tag);
            }
        }

        Ok(())
    }
}

fn dispatch(state: &mut State, event: Event) -> anyhow::Result<()> {
    match event {
        Event::Start(tag) => state.start_tag(tag),
        Event::End(tag) => state.end_tag(tag),

        Event::Text(text) => {
            if state.in_code_block {
                state.write(&text)?;
            } else {
                state.word_count += text.split_whitespace().count();
                state.write_escaped_body_text(&text)?;
                state.append_heading_text(&text);
            }
            Ok(())
        }

        Event::Code(text) => {
            state.write("<code>")?;
            state.write_escaped(&text)?;
            state.write("</code>")?;
            state.append_heading_text(&text);
            Ok(())
        }

        Event::InlineMath(text) => {
            state.write(r#"<span class="math math-inline">"#)?;
            state.write_escaped(&text)?;
            state.write(r#"</span>"#)?;
            Ok(())
        }

        Event::DisplayMath(text) => {
            state.write(r#"<div class="math math-display">"#)?;
            state.write_escaped(&text)?;
            state.write(r#"</div>"#)?;
            Ok(())
        }

        Event::Html(html) | Event::InlineHtml(html) => {
            if html.trim() == "<!--more-->" {
                state.finish_summary_text();
                state.summary_html = Some(state.writer.0.trim().to_string());
                return Ok(());
            }

            state.write(&html)?;
            Ok(())
        }

        Event::SoftBreak => {
            state.write("\n")?;
            state.append_heading_text(" ");
            Ok(())
        }

        Event::HardBreak => {
            state.write("<br>")?;
            Ok(())
        }

        Event::Rule => {
            state.write("<hr>")?;
            Ok(())
        }

        Event::FootnoteReference(name) => {
            state.write(r#"<sup class="footnote-ref"><a href="\#"#)?;
            escape_html(&mut state.writer, &name)?;
            state.write(r#"">"#)?;

            let next = 1 + state.footnotes.len();
            let index = *state.footnotes.entry(String::from(name)).or_insert(next);
            state.write(&format!("{}", index))?;
            state.write(r#"</a></sup>"#)?;
            Ok(())
        }

        Event::TaskListMarker(checked) => {
            state.write(r#"<input type="checkbox" disabled"#)?;
            if checked {
                state.write(r#" checked"#)?;
            }

            state.write(r#">"#)?;
            Ok(())
        }
    }
}

pub struct Rendered {
    pub summary: Option<String>,
    pub summary_text: Option<String>,
    pub content: String,
    pub toc: Vec<Outline>,
    pub word_count: usize,
}

const TOC_MARKER: &str = "<!--TOC-->";

pub fn render<'a, I>(
    templates: &Environment<'static>,
    base: &str,
    mut events: I,
) -> anyhow::Result<Rendered>
where
    I: Iterator<Item = (Event<'a>, Range<usize>)>,
{
    let mut state = State::new(templates, base)?;

    while let Some((event, range)) = events.next() {
        dispatch(&mut state, event)
            .with_context(|| format!("error at {}:{}", range.start, range.end))?;
    }

    if !state.stack.is_empty() {
        tracing::error!(
            "stack is not empty; have {} states left on the stack",
            state.stack.len()
        );

        for (writer, context) in state.stack.iter() {
            tracing::error!("writer: {:?}", writer);
            tracing::error!("context: {:?}", context);
        }

        anyhow::bail!("stack is not empty");
    }

    let mut content = state.take_content();
    let word_count = state.word_count;
    let summary_text = state.take_summary_text();
    let summary = state
        .summary_html
        .take()
        .filter(|summary| !summary.is_empty());
    let toc = state.outline.finish();

    let toc_html = crate::templates::render_toc_html(templates, &Value::from_serialize(&toc))?;

    content = content.replace(TOC_MARKER, &toc_html);
    let summary_text = summary_text.map(|text| text.replace(TOC_MARKER, &toc_html));
    let summary = summary.map(|text| text.replace(TOC_MARKER, &toc_html));

    Ok(Rendered {
        summary,
        summary_text,
        content,
        toc,
        word_count,
    })
}
