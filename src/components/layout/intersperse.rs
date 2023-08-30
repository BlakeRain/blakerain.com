use yew::Html;

pub struct Intersperse {
    inner: Vec<Html>,
    separator: Html,
}

impl Intersperse {
    pub fn new(separator: Html) -> Self {
        Self {
            inner: Vec::new(),
            separator,
        }
    }

    pub fn from_iter<I>(separator: Html, elements: I) -> Self
    where
        I: IntoIterator<Item = Html>,
    {
        let mut v = Self::new(separator);

        for element in elements {
            v.push(element);
        }

        v
    }

    pub fn push(&mut self, element: Html) {
        if !self.inner.is_empty() {
            self.inner.push(self.separator.clone());
        }

        self.inner.push(element);
    }

    pub fn finish(self) -> Html {
        self.inner.into_iter().collect()
    }
}
