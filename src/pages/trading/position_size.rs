use web_sys::HtmlSelectElement;
use yew::{
    function_component, html, use_context, use_effect, use_effect_with_deps, use_reducer, Callback,
    Children, ContextProvider, Html, Properties, TargetCast, UseReducerHandle,
};
use yew_hooks::{use_async, UseAsyncHandle};

use crate::{
    components::fields::{
        currency::CurrencySelect,
        label::Label,
        number::{format_number, Number},
        toggle::Toggle,
    },
    model::{
        currency::get_exchange_rates,
        trading::{
            account::{Account, AccountAction},
            position::{Direction, Position, PositionAction, PositionSize, StopLossQuantity},
        },
    },
};

type AccountHandle = UseReducerHandle<Account>;
type PositionHandle = UseReducerHandle<Position>;

#[function_component(AccountInfo)]
fn account_info() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");

    let currency_change = {
        let account = account.clone();
        Callback::from(move |currency| account.dispatch(AccountAction::SetCurrency { currency }))
    };

    let amount_change = {
        let account = account.clone();
        Callback::from(move |amount| {
            if let Some(amount) = amount {
                account.dispatch(AccountAction::SetAmount { amount })
            }
        })
    };

    let margin_risk_change = {
        let account = account.clone();
        Callback::from(move |risk| {
            if let Some(risk) = risk {
                account.dispatch(AccountAction::SetMarginRisk { risk: risk / 100.0 })
            }
        })
    };

    let position_risk_change = {
        let account = account.clone();
        Callback::from(move |risk| {
            if let Some(risk) = risk {
                account.dispatch(AccountAction::SetPositionRisk { risk: risk / 100.0 })
            }
        })
    };

    let places_change = {
        let account = account.clone();
        Callback::from(move |places| {
            if let Some(places) = places {
                let places = places as usize;
                account.dispatch(AccountAction::SetPlaces { places })
            }
        })
    };

    html! {
        <div class="flex flex-col gap-8 border border-primary rounded-md p-4">
            <h1 class="text-2xl font-semibold">{"Account Information"}</h1>
            <div class="grid grid-cols-2 items-center gap-4">
                <Label title="Account Currency">
                    <CurrencySelect
                        value={account.currency}
                        onchange={currency_change} />
                </Label>
                <Label title="Account Value">
                    <Number
                        thousands={true}
                        prefix={account.currency.symbol()}
                        places={account.places}
                        value={account.amount}
                        oninput={amount_change} />
                </Label>
                <Label title="Margin Risk">
                    <Number
                        value={account.margin_risk * 100.0}
                        places={0}
                        suffix="%"
                        onchange={margin_risk_change} />
                </Label>
                <Label title="Position Risk">
                    <Number
                        value={account.position_risk * 100.0}
                        places={0}
                        suffix="%"
                        onchange={position_risk_change} />
                </Label>
                <Label title="Decimal Places">
                    <Number
                        value={account.places as f64}
                        places={0}
                        suffix=" digits"
                        onchange={places_change} />
                </Label>
            </div>
        </div>
    }
}

#[function_component(PositionInfo)]
fn position_info() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let position_currency_change = {
        let position = position.clone();
        Callback::from(move |currency| {
            position.dispatch(PositionAction::SetPositionCurrency { currency })
        })
    };

    let quote_currency_change = {
        let position = position.clone();
        Callback::from(move |currency| {
            position.dispatch(PositionAction::SetQuoteCurrency { currency })
        })
    };

    let margin_change = {
        let position = position.clone();
        Callback::from(move |margin| {
            if let Some(margin) = margin {
                position.dispatch(PositionAction::SetMargin {
                    margin: margin / 100.0,
                });
            }
        })
    };

    let open_price_change = {
        let position = position.clone();
        Callback::from(move |price| {
            if let Some(price) = price {
                position.dispatch(PositionAction::SetOpenPrice { price });
            }
        })
    };

    let direction_change = {
        let position = position.clone();
        Callback::from(move |event: yew::Event| {
            let direction = event
                .target_dyn_into::<HtmlSelectElement>()
                .expect("target")
                .value()
                .parse::<Direction>()
                .expect("direction");
            position.dispatch(PositionAction::SetDirection { direction })
        })
    };

    let quantity_toggle = {
        let position = position.clone();
        Callback::from(move |enabled| {
            position.dispatch(PositionAction::SetQuantity {
                quantity: if enabled { Some(1.0) } else { None },
            });
        })
    };

    let quantity_change = {
        let position = position.clone();
        Callback::from(move |quantity| {
            if let Some(quantity) = quantity {
                if position.quantity.is_some() {
                    position.dispatch(PositionAction::SetQuantity {
                        quantity: Some(quantity),
                    });
                }
            }
        })
    };

    let affordable_click = {
        let account = account.clone();
        let position = position.clone();
        Callback::from(move |_| {
            if position.quantity.is_none() {
                return;
            }

            let PositionSize { affordable, .. } = PositionSize::compute(&account, &position);
            position.dispatch(PositionAction::SetQuantity {
                quantity: Some(affordable),
            });
        })
    };

    let stop_loss_click = {
        let account = account.clone();
        let position = position.clone();
        Callback::from(move |_| {
            if position.quantity.is_none() {
                return;
            }

            let StopLossQuantity { affordable, .. } =
                StopLossQuantity::compute(&account, &position);
            position.dispatch(PositionAction::SetQuantity {
                quantity: Some(affordable),
            });
        })
    };

    let stop_loss_toggle = {
        let position = position.clone();
        Callback::from(move |enabled| {
            position.dispatch(PositionAction::SetStopLoss {
                price: if enabled {
                    Some(position.open_price)
                } else {
                    None
                },
            });
        })
    };

    let stop_loss_change = {
        let position = position.clone();
        Callback::from(move |price| {
            if let Some(price) = price {
                if position.stop_loss.is_some() {
                    position.dispatch(PositionAction::SetStopLoss { price: Some(price) });
                }
            }
        })
    };

    let stop_loss_distance_change = {
        let position = position.clone();
        Callback::from(move |distance| {
            if let Some(distance) = distance {
                if position.stop_loss.is_some() {
                    position.dispatch(PositionAction::SetStopLoss {
                        price: Some(match position.direction {
                            Direction::Buy => position.open_price - distance,
                            Direction::Sell => position.open_price + distance,
                        }),
                    });
                }
            }
        })
    };

    let take_profit_toggle = {
        let position = position.clone();
        Callback::from(move |enabled| {
            position.dispatch(PositionAction::SetTakeProfit {
                price: if enabled {
                    Some(position.open_price)
                } else {
                    None
                },
            });
        })
    };

    let take_profit_change = {
        let position = position.clone();
        Callback::from(move |price| {
            if let Some(price) = price {
                if position.take_profit.is_some() {
                    position.dispatch(PositionAction::SetTakeProfit { price: Some(price) });
                }
            }
        })
    };

    let take_profit_distance_change = {
        let position = position.clone();
        Callback::from(move |distance| {
            if let Some(distance) = distance {
                if position.take_profit.is_some() {
                    position.dispatch(PositionAction::SetTakeProfit {
                        price: Some(match position.direction {
                            Direction::Buy => position.open_price + distance,
                            Direction::Sell => position.open_price - distance,
                        }),
                    });
                }
            }
        })
    };

    let tp_distance = match position.take_profit {
        None => 0.0,
        Some(tp) => match position.direction {
            Direction::Buy => tp - position.open_price,
            Direction::Sell => position.open_price - tp,
        },
    };

    let sl_distance = match position.stop_loss {
        None => 0.0,
        Some(sl) => match position.direction {
            Direction::Buy => position.open_price - sl,
            Direction::Sell => sl - position.open_price,
        },
    };

    let position_exchange = if account.currency != position.position_currency {
        format!(
            "Position ({}→{} {})",
            account.currency,
            position.position_currency,
            format_number(
                account
                    .exchange_rates
                    .rates
                    .get(&position.position_currency)
                    .copied()
                    .unwrap_or(0.0),
                false,
                account.places,
                Some(position.position_currency.symbol()),
                None
            )
            .expect("format_number")
        )
    } else {
        "Position".to_string()
    };

    let quote_exchange = if position.quote_currency != position.position_currency {
        format!(
            "Quote ({}→{} {})",
            position.position_currency,
            position.quote_currency,
            format_number(
                position.conversion,
                false,
                account.places,
                Some(position.quote_currency.symbol()),
                None
            )
            .expect("format_number")
        )
    } else {
        "Quote".to_string()
    };

    let position_margin = if position.margin != 0.0 {
        format!("Position Margin ({:.0}x leverage)", 1.0 / position.margin)
    } else {
        "Position Margin".to_string()
    };

    html! {
        <div class="flex flex-col gap-8 border border-primary rounded-md p-4">
            <h1 class="text-2xl font-semibold">{"Position Information"}</h1>
            <div class="grid grid-cols-2 items-center gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <Label title={position_exchange}>
                        <CurrencySelect
                            value={position.position_currency}
                            onchange={position_currency_change} />
                    </Label>
                    <Label title={quote_exchange}>
                        <CurrencySelect
                            value={position.quote_currency}
                            onchange={quote_currency_change} />
                    </Label>
                </div>
                <Label title={position_margin}>
                    <Number
                        value={position.margin * 100.0}
                        places={2}
                        suffix="%"
                        oninput={margin_change} />
                </Label>
                <Label title="Position Direction">
                    <select onchange={direction_change}>
                        <option
                            value={Direction::Buy.to_string()}
                            selected={position.direction == Direction::Buy}>
                            {"Buy"}
                        </option>
                        <option
                            value={Direction::Sell.to_string()}
                            selected={position.direction == Direction::Sell}>
                            {"Sell"}
                        </option>
                    </select>
                </Label>
                <Label title="Open Price">
                    <Number
                        value={position.open_price}
                        thousands={true}
                        places={account.places}
                        prefix={position.quote_currency.symbol()}
                        oninput={open_price_change} />
                </Label>
                <Label title="Quantity" class="col-start-1">
                    <div class="flex flex-row gap-4">
                        <Toggle
                            value={position.quantity.is_some()}
                            onchange={quantity_toggle} />
                        <Number
                            class="grow"
                            value={position.quantity.unwrap_or_default()}
                            thousands={true}
                            places={4}
                            suffix=" units"
                            disabled={position.quantity.is_none()}
                            oninput={quantity_change} />
                    </div>
                </Label>
                <div class="flex flex-row gap-2 pt-7">
                    <button
                        type="button"
                        class="button"
                        onclick={affordable_click}
                        disabled={position.quantity.is_none() || position.open_price == 0.0}>
                        {"Affordable Quantity"}
                    </button>
                    <button
                        type="button"
                        class="button"
                        onclick={stop_loss_click}
                        disabled={position.stop_loss.is_none() || sl_distance == 0.0}>
                        {"Stop Loss Quantity"}
                    </button>
                </div>
                <Label title="Stop Loss">
                    <div class="flex flex-row gap-4">
                        <Toggle
                            value={position.stop_loss.is_some()}
                            onchange={stop_loss_toggle} />
                        <Number
                            class="grow"
                            value={position.stop_loss.unwrap_or_default()}
                            thousands={true}
                            places={account.places}
                            prefix={position.quote_currency.symbol()}
                            disabled={position.stop_loss.is_none()}
                            onchange={stop_loss_change} />
                    </div>
                </Label>
                <Label title="Stop Loss Distance">
                    <Number
                        value={sl_distance}
                        thousands={true}
                        places={account.places}
                        prefix={position.quote_currency.symbol()}
                        disabled={position.stop_loss.is_none()}
                        onchange={stop_loss_distance_change} />
                </Label>
                <Label title="Take Profit">
                    <div class="flex flex-row gap-4">
                        <Toggle
                            value={position.take_profit.is_some()}
                            onchange={take_profit_toggle} />
                        <Number
                            class="grow"
                            value={position.take_profit.unwrap_or_default()}
                            thousands={true}
                            places={account.places}
                            prefix={position.quote_currency.symbol()}
                            disabled={position.take_profit.is_none()}
                            onchange={take_profit_change} />
                    </div>
                </Label>
                <Label title="Take Profit Distance">
                    <Number
                        value={tp_distance}
                        thousands={true}
                        places={account.places}
                        prefix={position.quote_currency.symbol()}
                        disabled={position.take_profit.is_none()}
                        onchange={take_profit_distance_change} />
                </Label>
            </div>
        </div>
    }
}

#[function_component(ReportPositionSize)]
fn report_position_size() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let PositionSize {
        available,
        available_position,
        available_quote,
        margin,
        margin_position,
        margin_quote,
        affordable,
        actual,
    } = PositionSize::compute(&account, &position);

    let ac = account.currency.symbol();
    let pc = position.position_currency.symbol();
    let qc = position.quote_currency.symbol();
    let ap = account.currency != position.position_currency;
    let pq = position.position_currency != position.quote_currency;

    let actual = if let Some(actual) = actual {
        html! {
            <div class="table">
                <table class="table tighter borderless">
                    <tbody>
                        <tr>
                            <th colspan="2" class="text-left">{"Actual Quantity"}</th>
                        </tr>
                        <tr>
                            <th class="text-left font-normal pl-4">
                                {"Actual cost of opening a position of "}
                                {format_number(
                                    position.quantity.unwrap_or_default(),
                                    true, 2, None, None
                                ).expect("format_number")}
                                {" units at "}
                                {format_number(
                                    position.open_price, true,
                                    account.places, Some(qc), None
                                ).expect("format_number")}
                            </th>
                            <td class="text-right">
                                {format_number(
                                    position.quantity.unwrap_or_default() * position.open_price,
                                    true, account.places, Some(qc), None
                                ).expect("format_number")}
                            </td>
                        </tr>
                        <tr>
                            <th class="text-left font-normal pl-4">
                                {"Amount of margin required at "}
                                {format_number(
                                    position.margin * 100.0, true,
                                    2, None, Some("%")
                                ).expect("format_number")}
                                {format!(" position margin ({:.0}x leverage)",
                                        1.0 / if position.margin == 0.0 {
                                            1.0
                                        } else {
                                            position.margin
                                        },
                                )}
                            </th>
                            <td class="text-right">
                                {format_number(
                                    actual.cost_quote, true,
                                    account.places, Some(qc), None
                                ).expect("format_number")}
                            </td>
                        </tr>
                        if pq {
                            <tr>
                                <th />
                                <td>
                                    {format_number(
                                        actual.cost_position, true,
                                        account.places, Some(pc), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                        if ap {
                            <tr>
                                <th />
                                <td>
                                    {format_number(
                                        actual.cost, true,
                                        account.places, Some(ac), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>
        }
    } else {
        html! {}
    };

    html! {
        <div class="flex flex-col gap-8 border border-primary rounded-md p-4">
            <h1 class="text-2xl font-semibold">{"Position Size Information"}</h1>
            <div class="table">
                <table class="table tighter borderless">
                    <tbody>
                        <tr>
                            <th colspan="2" class="text-left">{"Margin Risk"}</th>
                        </tr>
                        <tr>
                            <th class="text-left font-normal pl-4">
                                {"Amount of account available under margin risk"}
                            </th>
                            <td class="text-right">
                                {format_number(available, true,
                                               account.places, Some(ac), None
                                ).expect("format_number")}
                            </td>
                        </tr>
                        if ap {
                            <tr>
                                <th class="text-left font-normal pl-4">
                                    {"Available account under margin risk in the position currency"}
                                </th>
                                <td class="text-right">
                                    {format_number(
                                            available_position, true,
                                            account.places, Some(pc), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                        if pq {
                            <tr>
                                <th class="text-left font-normal pl-4">
                                    {"Available account under margin risk in the quote currency"}
                                </th>
                                <td class="text-right">
                                    {format_number(
                                            available_quote, true,
                                            account.places, Some(qc), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                    </tbody>
                </table>
            </div>

            <div class="table">
                <table class="table tighter borderless">
                    <tbody>
                        <tr>
                            <th colspan="2" class="text-left">{"Position Margin and Amount"}</th>
                        </tr>
                        <tr>
                            <th class="text-left font-normal pl-4">
                                {"Available amount with a "}
                                {format_number(
                                        position.margin * 100.0,
                                        true, 2, None, Some("%")
                                ).expect("format_number")}
                                {" position margin"}
                            </th>
                            <td class="text-right">
                                {format_number(
                                        margin, true,
                                        account.places, Some(ac), None
                                ).expect("format_number")}
                            </td>
                        </tr>
                        if ap {
                            <tr>
                                <th class="text-left font-normal pl-4">
                                    {"Available amount under position margin in position currency"}
                                </th>
                                <td class="text-right">
                                    {format_number(
                                            margin_position, true,
                                            account.places, Some(pc), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                        if pq {
                            <tr>
                                <th class="text-left font-normal pl-4">
                                    {"Available amount under position margin in quote currency"}
                                </th>
                                <td class="text-right">
                                    {format_number(
                                            margin_quote, true,
                                            account.places, Some(qc), None
                                    ).expect("format_number")}
                                </td>
                            </tr>
                        }
                        <tr>
                            <th class="text-left font-normal pl-4">
                                {"Position size available at open price of "}
                                {format_number(
                                        position.open_price, true,
                                        account.places, Some(qc), None
                                ).expect("format_number")}
                                {" with margin of "}
                                {format_number(
                                        margin_quote, true,
                                        account.places, Some(qc), None
                                ).expect("format_number")}
                            </th>
                            <td class="text-right">
                                {format_number(
                                        affordable, true,
                                        2, None, Some(" units")
                                ).expect("format_number")}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {actual}
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct AccountProviderProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(AccountProvider)]
fn account_provider(props: &AccountProviderProps) -> Html {
    let account = use_reducer(Account::default);

    let get_exchange_rates: UseAsyncHandle<(), &'static str> = {
        let account = account.clone();
        use_async(async move {
            let rates = get_exchange_rates(account.currency, None).await?;
            account.dispatch(AccountAction::SetExchangeRates {
                exchange_rates: rates,
            });
            Ok(())
        })
    };

    use_effect_with_deps(
        move |_| {
            get_exchange_rates.run();
        },
        account.currency,
    );

    html! {
        <ContextProvider<AccountHandle> context={account}>
            {props.children.clone()}
        </ContextProvider<AccountHandle>>
    }
}

#[derive(Properties, PartialEq)]
struct PositionProviderProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(PositionProvider)]
fn position_provider(props: &PositionProviderProps) -> Html {
    let position = use_reducer(Position::default);

    let get_exchange_rates: UseAsyncHandle<(), &'static str> = {
        let position = position.clone();
        use_async(async move {
            let rates =
                get_exchange_rates(position.position_currency, Some(position.quote_currency))
                    .await?;
            position.dispatch(PositionAction::SetConversion {
                conversion: rates
                    .rates
                    .get(&position.quote_currency)
                    .copied()
                    .unwrap_or(1.0),
            });
            Ok(())
        })
    };

    use_effect_with_deps(
        move |_| {
            get_exchange_rates.run();
        },
        (position.position_currency, position.quote_currency),
    );

    html! {
        <ContextProvider<PositionHandle> context={position}>
            {props.children.clone()}
        </ContextProvider<PositionHandle>>
    }
}

#[function_component(Page)]
pub fn page() -> Html {
    html! {
        <AccountProvider>
            <PositionProvider>
                <div class="container mx-auto my-20">
                    <div class="grid grid-cols-2 gap-8">
                        <AccountInfo />
                        <PositionInfo />
                    </div>
                    <div class="grid grid-cols-2 gap-8 mt-8">
                        <ReportPositionSize />
                    </div>
                </div>
            </PositionProvider>
        </AccountProvider>
    }
}
