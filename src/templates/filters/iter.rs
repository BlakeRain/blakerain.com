use minijinja::{Error, Value};

pub fn take(value: &Value, count: usize) -> Result<Value, Error> {
    let mut result = Vec::new();
    for item in value.try_iter()? {
        if result.len() >= count {
            break;
        }

        result.push(item);
    }

    Ok(Value::from(result))
}

pub fn concat(value: &Value) -> Result<Value, Error> {
    let mut result = Vec::new();
    for item in value.try_iter()? {
        let item_iter = item.try_iter()?;
        result.extend(item_iter);
    }

    Ok(Value::from(result))
}
