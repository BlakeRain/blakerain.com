use rust_stemmers::{Algorithm, Stemmer};

use super::stop::is_stop_word;

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub text: String,
    pub start: usize,
    pub length: usize,
}

pub fn tokenize_phrasing(input: &str) -> Vec<Token> {
    let stemmer = Stemmer::create(Algorithm::English);
    let input = input.to_lowercase().chars().collect::<Vec<_>>();
    let mut tokens = Vec::new();
    let mut index = 0;

    while index < input.len() {
        while index < input.len()
            && input
                .get(index)
                .copied()
                .map(char::is_whitespace)
                .unwrap_or(false)
        {
            index += 1;
        }

        let start = index;

        let mut text = String::new();
        while let Some(ch) = input.get(index) {
            if ch.is_whitespace() {
                break;
            }

            text.push(*ch);
            index += 1;
        }

        if text.is_empty() {
            continue;
        }

        if is_stop_word(&text) {
            continue;
        }

        text = stemmer.stem(&text).to_string();

        tokens.push(Token {
            text,
            start,
            length: index - start + 1,
        });
    }

    tokens
}

pub fn tokenize_code(input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();

    tokens
}

#[cfg(test)]
mod tests {
    use super::*;

    fn verify_phrasing_tokens(input: &str, expected: Vec<&str>) {
        assert_eq!(
            tokenize_phrasing(input)
                .into_iter()
                .map(|token| token.text)
                .collect::<Vec<_>>(),
            expected
        );
    }

    #[test]
    fn test_phrasing() {
        verify_phrasing_tokens(
            "The quick brown fox jumps over the lazy dog",
            vec!["quick", "brown", "fox", "jump", "lazi", "dog"],
        );
    }
}
