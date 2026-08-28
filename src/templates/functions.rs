use std::collections::HashMap;

use minijinja::{value::Rest, Environment, Error, ErrorKind, Value};

mod css;
mod data;
mod icon;
mod image;
mod path;

pub fn register(environment: &mut Environment) {
    environment.add_function("abort", abort);
    environment.add_function("assign", assign);
    environment.add_function("base_url", path::base_url);
    environment.add_function("css", css::css);
    environment.add_function("file_exists", path::file_exists);
    environment.add_function("icon", icon::icon);
    environment.add_function("image", image::image);
    environment.add_function("load_data", data::load_data);
    environment.add_function("load_page", data::load_page);
    environment.add_function("load_pages", data::load_pages);
    environment.add_function("path_drop_prefix", path::path_drop_prefix);
    environment.add_function("path_join", path::path_join);
    environment.add_function("path_parent", path::path_parent);
    environment.add_function("repeat", repeat);
}

fn abort(message: &str) -> Result<(), Error> {
    Err(Error::new(
        ErrorKind::InvalidOperation,
        format!("aborted: {message}"),
    ))
}

fn assign(value: Value, args: Rest<Value>) -> Result<Value, Error> {
    let mut obj = if value.is_undefined() {
        HashMap::new()
    } else if let Some(obj) = value.as_object() {
        obj.try_iter_pairs().into_iter().flatten().collect()
    } else {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "value is not an object",
        ));
    };

    let mut args = args.0.into_iter();

    loop {
        let Some(key) = args.next() else {
            break;
        };

        let Some(value) = args.next() else {
            return Err(Error::new(
                ErrorKind::InvalidOperation,
                format!("expected value for key {:?}", key),
            ));
        };

        obj.insert(key, value);
    }

    Ok(Value::from_object(obj))
}

fn repeat(value: &str, count: usize) -> Result<Value, Error> {
    Ok(value.repeat(count).into())
}
