use std::path::Path;

use anyhow::Context;
use serde_json::{Map, Value};
use yaml_rust::Yaml;

pub fn load_yaml<P: AsRef<Path>>(path: P) -> anyhow::Result<Value> {
    let path = path.as_ref();

    if !path.is_file() {
        return Err(anyhow::anyhow!("YAML file not found at {:?}", path));
    }

    let contents = std::fs::read_to_string(&path).context("failed to read YAML file")?;
    parse_yaml(&contents)
}

pub fn parse_yaml(yaml: &str) -> anyhow::Result<Value> {
    let yaml = yaml_rust::YamlLoader::load_from_str(yaml).map_err(|err| {
        tracing::error!(error = ?err, "failed to parse YAML");
        anyhow::anyhow!("failed to parse YAML: {}", err)
    })?;

    if yaml.len() > 1 {
        return Err(anyhow::anyhow!("YAML document had more than one root node"));
    };

    let Some(root) = yaml.into_iter().next() else {
        return Err(anyhow::anyhow!("YAML document had no root node"));
    };

    yaml_to_json(root)
}

fn yaml_to_json(yaml: Yaml) -> anyhow::Result<Value> {
    match yaml {
        Yaml::Real(real) => Ok(Value::Number(
            real.parse().context("failed to parse YAML real")?,
        )),

        Yaml::Integer(integer) => Ok(Value::Number(integer.into())),
        Yaml::String(string) => Ok(Value::String(string)),
        Yaml::Boolean(boolean) => Ok(Value::Bool(boolean)),

        Yaml::Array(array) => Ok(Value::Array(
            array
                .into_iter()
                .map(yaml_to_json)
                .collect::<anyhow::Result<Vec<Value>>>()?,
        )),

        Yaml::Hash(hash) => Ok(Value::Object({
            let mut object = Map::new();

            for (key, value) in hash.into_iter() {
                let Yaml::String(key) = key else {
                    return Err(anyhow::anyhow!("hash key was not a string"));
                };

                object.insert(key, yaml_to_json(value)?);
            }

            object
        })),

        Yaml::Alias(_) => Err(anyhow::anyhow!("YAML alias not supported")),

        Yaml::Null => Ok(Value::Null),
        Yaml::BadValue => Err(anyhow::anyhow!("bad value")),
    }
}
