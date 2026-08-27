use minijinja::Environment;

mod date;
mod iter;
mod string;
mod url;

pub fn register(environment: &mut Environment) {
    environment.add_filter("concat", iter::concat);
    environment.add_filter("date", date::date);
    environment.add_filter("datetime", date::datetime);
    environment.add_filter("parse_url", url::parse_url);
    environment.add_filter("substr", string::substr);
    environment.add_filter("take", iter::take);
}
