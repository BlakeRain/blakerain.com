use minijinja::{Error, Value};

fn page_url(base: &str, page: usize) -> String {
    let base = base.trim_matches('/');

    if page <= 1 {
        format!("/{base}/")
    } else {
        format!("/{base}/page/{page}/")
    }
}

pub fn paginate(
    items: Value,
    page_number: usize,
    page_size: usize,
    base: &str,
) -> Result<Value, Error> {
    let page_size = page_size.max(1);

    let items: Vec<Value> = items.try_iter()?.collect();
    let total_items = items.len();
    let total_pages = if total_items == 0 {
        1
    } else {
        total_items.div_ceil(page_size)
    };

    let page_number = page_number.clamp(1, total_pages);

    let start = (page_number - 1) * page_size;
    let page_items: Vec<Value> = items.into_iter().skip(start).take(page_size).collect();

    let pages: Vec<Value> = (1..=total_pages)
        .map(|page| {
            minijinja::context! {
                number => page,
                url => page_url(base, page),
            }
        })
        .collect();

    let prev = (page_number > 1).then(|| page_url(base, page_number - 1));
    let next = (page_number < total_pages).then(|| page_url(base, page_number + 1));

    Ok(minijinja::context! {
        items => page_items,
        page => page_number,
        total_pages => total_pages,
        prev => prev.map(Value::from).unwrap_or(Value::UNDEFINED),
        next => next.map(Value::from).unwrap_or(Value::UNDEFINED),
        pages => pages,
    })
}
