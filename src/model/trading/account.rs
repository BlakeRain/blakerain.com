use std::rc::Rc;

use gloo::storage::{errors::StorageError, Storage};
use serde::{Deserialize, Serialize};
use yew::Reducible;

use crate::model::currency::{Currency, ExchangeRates};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Account {
    pub places: usize,
    pub currency: Currency,
    pub exchange_rates: ExchangeRates,
    pub amount: f64,
    pub margin_risk: f64,
    pub position_risk: f64,
}

impl Default for Account {
    fn default() -> Self {
        let currency = Currency::GBP;

        Self {
            places: 4,
            currency,
            exchange_rates: ExchangeRates::new(currency),
            amount: 500.0,
            margin_risk: 0.01,
            position_risk: 0.01,
        }
    }
}

pub enum AccountAction {
    Load,
    SetPlaces { places: usize },
    SetCurrency { currency: Currency },
    SetExchangeRates { exchange_rates: ExchangeRates },
    SetAmount { amount: f64 },
    SetMarginRisk { risk: f64 },
    SetPositionRisk { risk: f64 },
}

impl Reducible for Account {
    type Action = AccountAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        let account = match action {
            AccountAction::Load => Self::load(),

            AccountAction::SetPlaces { places } => Self {
                places,
                ..(*self).clone()
            },

            AccountAction::SetCurrency { currency } => Self {
                currency,
                ..(*self).clone()
            },

            AccountAction::SetExchangeRates { exchange_rates } => Self {
                exchange_rates,
                ..(*self).clone()
            },

            AccountAction::SetAmount { amount } => Self {
                amount,
                ..(*self).clone()
            },

            AccountAction::SetMarginRisk { risk } => Self {
                margin_risk: risk,
                ..(*self).clone()
            },

            AccountAction::SetPositionRisk { risk } => Self {
                position_risk: risk,
                ..(*self).clone()
            },
        };

        account.save();
        account.into()
    }
}

impl Account {
    pub fn load() -> Self {
        match gloo::storage::LocalStorage::get("trading.account") {
            Ok(stored) => stored,
            Err(err) => match err {
                StorageError::KeyNotFound(_) => {
                    log::info!("No stored trading account found, using defaults");
                    Self::default()
                }

                _ => {
                    log::error!("Failed to retrieve trading account from local storage: {err:?}");
                    Self::default()
                }
            },
        }
    }

    pub fn save(&self) {
        if let Err(err) = gloo::storage::LocalStorage::set("trading.account", self) {
            log::error!("Failed to store trading account in local storage: {err:?}");
        }
    }
}
