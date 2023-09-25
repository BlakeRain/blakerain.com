use std::{fmt::Display, rc::Rc, str::FromStr};

use yew::Reducible;

use crate::model::currency::Currency;

use super::account::Account;

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum Direction {
    Buy,
    Sell,
}

impl Display for Direction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Buy => write!(f, "Buy"),
            Self::Sell => write!(f, "Sell"),
        }
    }
}

impl FromStr for Direction {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Buy" => Ok(Self::Buy),
            "Sell" => Ok(Self::Sell),
            _ => Err(()),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Position {
    pub position_currency: Currency,
    pub quote_currency: Currency,
    pub conversion: f64,
    pub open_price: f64,
    pub quantity: Option<f64>,
    pub direction: Direction,
    pub margin: f64,
    pub take_profit: Option<f64>,
    pub stop_loss: Option<f64>,
}

impl Default for Position {
    fn default() -> Self {
        Self {
            position_currency: Currency::GBP,
            quote_currency: Currency::GBP,
            conversion: 1.0,
            open_price: 0.0,
            quantity: None,
            direction: Direction::Buy,
            margin: 0.05,
            take_profit: None,
            stop_loss: None,
        }
    }
}

pub enum PositionAction {
    SetPositionCurrency { currency: Currency },
    SetQuoteCurrency { currency: Currency },
    SetConversion { conversion: f64 },
    SetOpenPrice { price: f64 },
    SetQuantity { quantity: Option<f64> },
    SetDirection { direction: Direction },
    SetMargin { margin: f64 },
    SetTakeProfit { price: Option<f64> },
    SetStopLoss { price: Option<f64> },
}

impl Reducible for Position {
    type Action = PositionAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        match action {
            PositionAction::SetPositionCurrency { currency } => Self {
                position_currency: currency,
                ..(*self).clone()
            },

            PositionAction::SetQuoteCurrency { currency } => Self {
                quote_currency: currency,
                ..(*self).clone()
            },

            PositionAction::SetConversion { conversion } => Self {
                conversion,
                ..(*self).clone()
            },

            PositionAction::SetOpenPrice { price } => Self {
                open_price: price,
                ..(*self).clone()
            },

            PositionAction::SetQuantity { quantity } => Self {
                quantity,
                ..(*self).clone()
            },

            PositionAction::SetDirection { direction } => Self {
                direction,
                ..(*self).clone()
            },

            PositionAction::SetMargin { margin } => Self {
                margin,
                ..(*self).clone()
            },

            PositionAction::SetTakeProfit { price } => Self {
                take_profit: price,
                ..(*self).clone()
            },

            PositionAction::SetStopLoss { price } => Self {
                stop_loss: price,
                ..(*self).clone()
            },
        }
        .into()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct PositionSize {
    /// Funds available under margin risk (in account currency)
    pub available: f64,
    /// Funds available under margin risk (in position currency)
    pub available_position: f64,
    /// Funds available under margin risk (in quote currency)
    pub available_quote: f64,
    /// Margin available under margin risk (in account currency)
    pub margin: f64,
    /// Margin available (in position currency)
    pub margin_position: f64,
    /// margin available (in quote currency)
    pub margin_quote: f64,
    /// Quantity affordable at position price (in units)
    pub affordable: f64,
    /// Optional actual position size margin risk
    pub actual: Option<ActualPositionSize>,
}

impl PositionSize {
    pub fn compute(account: &Account, position: &Position) -> Self {
        let p_rate = account
            .exchange_rates
            .rates
            .get(&position.position_currency)
            .copied()
            .unwrap_or(1.0);
        let q_rate = position.conversion;
        let available = account.amount * account.margin_risk;
        let available_position = available * p_rate;
        let available_quote = available_position * q_rate;

        let margin = available
            / if position.margin == 0.0 {
                1.0
            } else {
                position.margin
            };

        let margin_position = margin * p_rate;
        let margin_quote = margin_position * q_rate;

        let affordable = if position.open_price == 0.0 {
            0.0
        } else {
            margin_quote / position.open_price
        };

        Self {
            available,
            available_position,
            available_quote,
            margin,
            margin_position,
            margin_quote,
            affordable,
            actual: position.quantity.map(|quantity| {
                ActualPositionSize::compute(account, position, quantity, p_rate, q_rate)
            }),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ActualPositionSize {
    /// The actual quote cost (in quote currency)
    pub cost_quote: f64,
    /// The actual position cost (in position currency)
    pub cost_position: f64,
    /// The actual position cost (in account currency)
    pub cost: f64,
    /// The account margin required (percent)
    pub margin: f64,
}

impl ActualPositionSize {
    pub fn compute(
        account: &Account,
        position: &Position,
        quantity: f64,
        q_rate: f64,
        p_rate: f64,
    ) -> Self {
        let cost_quote = quantity * position.open_price * position.margin;
        let cost_position = cost_quote / q_rate;
        let cost = cost_position / p_rate;
        let margin = cost / account.amount;

        Self {
            cost_quote,
            cost_position,
            cost,
            margin,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StopLoss {
    /// Funds available under position risk (in account currency)
    pub available: f64,
    /// Funds available under position risk (in position currency)
    pub available_position: f64,
    /// Funds available under position risk (in quote currency)
    pub available_quote: f64,
    /// Specified position size
    pub quantity: f64,
    /// Required stop-loss distance
    pub distance: f64,
    /// Optional actual stop-loss assessment
    pub actual: Option<ActualStopLoss>,
}

impl StopLoss {
    pub fn compute(account: &Account, position: &Position, quantity: f64) -> Self {
        let p_rate = account
            .exchange_rates
            .rates
            .get(&position.position_currency)
            .copied()
            .unwrap_or(1.0);
        let q_rate = position.conversion;
        let available = account.amount * account.position_risk;
        let available_position = available * p_rate;
        let available_quote = available_position * q_rate;
        let distance = if quantity == 0.0 {
            0.0
        } else {
            available_quote / quantity
        };

        Self {
            available,
            available_position,
            available_quote,
            quantity,
            distance,
            actual: position.stop_loss.map(|stop_loss| {
                ActualStopLoss::compute(account, position, quantity, p_rate, q_rate, stop_loss)
            }),
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ActualStopLoss {
    /// The actual stop-loss distance (in position currency)
    pub distance: f64,
    /// The possible loss
    pub loss: f64,
    /// The actual position risk (percent)
    pub risk: f64,
}

impl ActualStopLoss {
    pub fn compute(
        account: &Account,
        position: &Position,
        quantity: f64,
        p_rate: f64,
        q_rate: f64,
        stop_loss: f64,
    ) -> Self {
        let distance = match position.direction {
            Direction::Buy => position.open_price - stop_loss,
            Direction::Sell => stop_loss - position.open_price,
        };

        let loss = (distance * quantity) / (p_rate * q_rate);
        let risk = loss / account.amount;

        Self {
            distance,
            loss,
            risk,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct StopLossQuantity {
    /// Funds available under position risk (in account currency)
    pub available: f64,
    /// Funds available under position risk (in position currency)
    pub available_position: f64,
    /// Funds available under position risk (in quote currency)
    pub available_quote: f64,
    /// Computed stop loss distance (in position currency)
    pub distance: f64,
    /// Amount that can be bought at the given stop loss (in units)
    pub affordable: f64,
    /// Required margin for that amount (in account currency)
    pub margin: f64,
}

impl StopLossQuantity {
    pub fn compute(account: &Account, position: &Position) -> Self {
        let distance = if let Some(stop_loss) = position.stop_loss {
            match position.direction {
                Direction::Buy => position.open_price - stop_loss,
                Direction::Sell => stop_loss - position.open_price,
            }
        } else {
            0.0
        };

        let p_rate = account
            .exchange_rates
            .rates
            .get(&position.position_currency)
            .copied()
            .unwrap_or(1.0);
        let q_rate = position.conversion;
        let available = account.amount * account.position_risk;
        let available_position = available * p_rate;
        let available_quote = available_position * q_rate;
        let affordable = available_quote / distance;
        let margin = (affordable * position.open_price * position.margin) / (p_rate * q_rate);

        Self {
            available,
            available_position,
            available_quote,
            distance,
            affordable,
            margin,
        }
    }
}
