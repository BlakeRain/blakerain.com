use std::sync::Arc;

use minijinja::{
    Error, ErrorKind, State, Value,
    value::{Enumerator, Object},
};

#[derive(Debug)]
struct Url(url::Url);

impl Object for Url {
    fn enumerate(self: &Arc<Self>) -> Enumerator {
        Enumerator::Str(&[
            "scheme",
            "has_authority",
            "authority",
            "username",
            "password",
            "has_host",
            "host",
            "domain",
            "port",
            "path",
            "query",
            "fragment",
        ])
    }

    fn get_value(self: &Arc<Self>, key: &Value) -> Option<Value> {
        match key.as_str()? {
            "scheme" => Some(Value::from(self.0.scheme())),
            "has_authority" => Some(Value::from(self.0.has_authority())),
            "authority" => Some(Value::from(self.0.authority())),
            "username" => Some(Value::from(self.0.username())),
            "password" => Some(Value::from(self.0.password())),
            "has_host" => Some(Value::from(self.0.has_host())),
            "host" => Some(Value::from(self.0.host_str())),
            "domain" => Some(Value::from(self.0.domain())),
            "port" => Some(Value::from(self.0.port())),
            "path" => Some(Value::from(self.0.path())),
            "query" => Some(Value::from(self.0.query())),
            "fragment" => Some(Value::from(self.0.fragment())),
            _ => None,
        }
    }

    fn call_method(
        self: &Arc<Self>,
        _: &State,
        method: &str,
        args: &[Value],
    ) -> Result<Value, Error> {
        match method {
            "join" => {
                let Some(input) = args.first() else {
                    return Err(Error::new(
                        ErrorKind::MissingArgument,
                        "join requires an argument",
                    ));
                };

                let Some(input) = input.as_str() else {
                    return Err(Error::new(
                        ErrorKind::InvalidOperation,
                        "join requires a string",
                    ));
                };

                Ok(Value::from_object(Url(self.0.join(input).map_err(
                    |err| {
                        Error::new(ErrorKind::InvalidOperation, "failed to join URL")
                            .with_source(err)
                    },
                )?)))
            }

            "make_relative" => {
                let Some(input) = args.first() else {
                    return Err(Error::new(
                        ErrorKind::MissingArgument,
                        "make_relative requires an argument",
                    ));
                };

                let Some(input) = input.downcast_object_ref::<Url>() else {
                    return Err(Error::new(
                        ErrorKind::InvalidOperation,
                        "make_relative requires a URL",
                    ));
                };

                Ok(Value::from(self.0.make_relative(&input.0)))
            }

            "set_scheme" => {
                let Some(input) = args.first() else {
                    return Err(Error::new(
                        ErrorKind::MissingArgument,
                        "set_scheme requires an argument",
                    ));
                };

                let Some(input) = input.as_str() else {
                    return Err(Error::new(
                        ErrorKind::InvalidOperation,
                        "set_scheme requires a string",
                    ));
                };

                let mut result = self.0.clone();
                if result.set_scheme(input).is_err() {
                    return Err(Error::new(ErrorKind::InvalidOperation, "invalid scheme"));
                }

                Ok(Value::from_object(Url(result)))
            }

            "set_path" => {
                let Some(input) = args.first() else {
                    return Err(Error::new(
                        ErrorKind::MissingArgument,
                        "set_path requires an argument",
                    ));
                };

                let Some(input) = input.as_str() else {
                    return Err(Error::new(
                        ErrorKind::InvalidOperation,
                        "set_path requires a string",
                    ));
                };

                let mut result = self.0.clone();
                result.set_path(input);

                Ok(Value::from_object(Url(result)))
            }

            "to_string" => Ok(Value::from(self.0.as_str())),

            _ => Err(Error::from(ErrorKind::UnknownMethod)),
        }
    }
}

pub fn parse_url(value: &str) -> Result<Value, Error> {
    let url = url::Url::parse(value)
        .map_err(|err| Error::new(ErrorKind::InvalidOperation, "invalid URL").with_source(err))?;

    Ok(Value::from_object(Url(url)))
}
