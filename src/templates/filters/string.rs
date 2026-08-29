use minijinja::{Error, ErrorKind, value::Kwargs};

pub fn substr(value: String, kwargs: Kwargs) -> Result<String, Error> {
    let start = kwargs.get::<Option<usize>>("start")?.unwrap_or(0);
    let len = kwargs.get::<Option<usize>>("len")?;
    let end = kwargs.get::<Option<isize>>("end")?;

    if len.is_some() && end.is_some() {
        return Err(Error::new(
            ErrorKind::InvalidOperation,
            "cannot specify both len and end",
        ));
    }

    let end = end.map(|end| {
        if end < 0 {
            (value.len() as isize + end).max(0) as usize
        } else {
            end as usize
        }
    });

    let end = if let Some(len) = len {
        start + len
    } else if let Some(end) = end {
        end
    } else {
        value.len()
    };

    Ok(value.chars().skip(start).take(end - start).collect())
}
