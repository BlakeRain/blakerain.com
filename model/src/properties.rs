use std::collections::HashMap;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Properties {
    properties: HashMap<String, Option<String>>,
}

impl From<HashMap<String, Option<String>>> for Properties {
    fn from(properties: HashMap<String, Option<String>>) -> Self {
        Self { properties }
    }
}

impl Properties {
    pub fn has(&self, name: &str) -> bool {
        self.properties.contains_key(name)
    }

    pub fn get(&self, name: &str) -> Option<&str> {
        if let Some(value) = self.properties.get(name) {
            if let Some(value) = value.as_deref() {
                return Some(value);
            }
        }

        None
    }
}
