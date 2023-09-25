use std::{collections::HashMap, fmt::Display, str::FromStr};

use gloo::net::http::Request;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Hash, Serialize, Deserialize)]
pub enum Currency {
    AUD,
    CAD,
    EUR,
    GBP,
    JPY,
    USD,
}

impl Default for Currency {
    fn default() -> Self {
        Self::USD
    }
}

impl Display for Currency {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Currency::AUD => "AUD",
                Currency::CAD => "CAD",
                Currency::EUR => "EUR",
                Currency::GBP => "GBP",
                Currency::JPY => "JPY",
                Currency::USD => "USD",
            }
        )
    }
}

impl FromStr for Currency {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "AUD" => Ok(Currency::AUD),
            "CAD" => Ok(Currency::CAD),
            "EUR" => Ok(Currency::EUR),
            "GBP" => Ok(Currency::GBP),
            "JPY" => Ok(Currency::JPY),
            "USD" => Ok(Currency::USD),
            _ => Err(()),
        }
    }
}

impl Currency {
    pub fn symbol(&self) -> &'static str {
        match self {
            Currency::AUD => "$",
            Currency::CAD => "$",
            Currency::EUR => "€",
            Currency::GBP => "£",
            Currency::JPY => "¥",
            Currency::USD => "$",
        }
    }
}

pub static CURRENCIES: &[Currency] = &[
    Currency::AUD,
    Currency::CAD,
    Currency::EUR,
    Currency::GBP,
    Currency::JPY,
    Currency::USD,
];

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ExchangeRates {
    /// The base currency
    pub base: Currency,
    /// The rates converting from `base` to the target currency
    pub rates: HashMap<Currency, f64>,
}

impl Default for ExchangeRates {
    fn default() -> Self {
        Self::new(Currency::default())
    }
}

impl ExchangeRates {
    pub fn new(base: Currency) -> Self {
        let mut rates = HashMap::new();
        rates.insert(base, 1.0);
        Self { base, rates }
    }
}

#[derive(Debug, Deserialize)]
struct ExchangeRateResult {
    success: bool,
    base: String,
    date: String,
    rates: HashMap<String, f64>,
}

pub async fn get_exchange_rates(
    base: Currency,
    target: Option<Currency>,
) -> Result<ExchangeRates, &'static str> {
    let symbols = target.as_ref().map(Currency::to_string).unwrap_or_else(|| {
        CURRENCIES
            .iter()
            .map(Currency::to_string)
            .collect::<Vec<_>>()
            .join(",")
    });

    let res = Request::get(&format!(
        "https://api.exchangerate.host/latest?base={base}&symbols={symbols}"
    ))
    .send()
    .await
    .map_err(|err| {
        log::error!("Failed to send request to api.exchangerate.host: {err:?}");
        "Failed to send request to api.exchangerate.host"
    })?
    .json::<ExchangeRateResult>()
    .await
    .map_err(|err| {
        log::error!("Failed to parse response from api.exchangerate.host: {err:?}");
        "Failed to parse response from api.exchangerate.host"
    })?;

    let mut rates = HashMap::new();
    for (symbol, rate) in res.rates {
        match symbol.parse() {
            Ok(currency) => {
                rates.insert(currency, rate);
            }

            Err(err) => {
                log::error!("Failed to parse currency symbol '{symbol}' from api.exchangerate.host: {err:?}");
            }
        }
    }

    Ok(ExchangeRates { base, rates })
}
