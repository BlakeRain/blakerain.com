use crate::parsing::{toml::parse_toml, yaml::parse_yaml};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FrontmatterMode {
    Yaml,
    Toml,
}

impl FrontmatterMode {
    fn get_prefix(&self) -> &'static str {
        match self {
            Self::Yaml => "---",
            Self::Toml => "+++",
        }
    }

    fn parse(&self, src: &str) -> anyhow::Result<serde_json::Value> {
        match self {
            Self::Yaml => parse_yaml(src),
            Self::Toml => parse_toml(src),
        }
    }
}

pub fn parse_frontmatter(lines: Vec<String>) -> anyhow::Result<(serde_json::Value, Vec<String>)> {
    let mut lines = lines.into_iter();

    let Some(ident_line) = lines.next() else {
        return Ok((serde_json::Value::Null, vec![]));
    };

    let mode = if ident_line.starts_with("---") {
        FrontmatterMode::Yaml
    } else if ident_line.starts_with("+++") {
        FrontmatterMode::Toml
    } else {
        let source = std::iter::once(ident_line).chain(lines).collect();
        return Ok((serde_json::Value::Null, source));
    };

    let prefix = mode.get_prefix();
    let mut source = Vec::new();
    while let Some(line) = lines.next() {
        if line.starts_with(prefix) {
            break;
        }

        source.push(line.clone());
    }

    let lines = lines.collect();

    if source.is_empty() {
        return Ok((serde_json::Value::Null, lines));
    }

    let frontmatter = mode.parse(&source.join("\n"))?;
    Ok((frontmatter, lines))
}
