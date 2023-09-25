use web_sys::HtmlSelectElement;
use yew::{
    classes, function_component, html, use_context, use_effect_with_deps, use_reducer, AttrValue,
    Callback, Children, Classes, ContextProvider, Html, Properties, TargetCast, UseReducerHandle,
};
use yew_hooks::{use_async, UseAsyncHandle};

use crate::{
    components::{
        display::{
            client_only::ClientOnly,
            tooltip::{Tooltip, TooltipPosition},
        },
        fields::{
            currency::CurrencySelect,
            label::Label,
            number::{format_number, Number},
            toggle::Toggle,
        },
    },
    model::{
        currency::{get_exchange_rates, Currency},
        trading::{
            account::{Account, AccountAction},
            position::{
                ActualStopLoss, Direction, Position, PositionAction, PositionSize, StopLoss,
                StopLossQuantity,
            },
        },
    },
};

type AccountHandle = UseReducerHandle<Account>;
type PositionHandle = UseReducerHandle<Position>;

#[derive(Properties, PartialEq)]
struct PanelProps {
    pub title: AttrValue,
    #[prop_or_default]
    pub skip: bool,
    #[prop_or_default]
    pub class: Classes,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Panel)]
fn panel(props: &PanelProps) -> Html {
    let start = if props.skip { "md:col-start-2" } else { "" };

    html! {
        <div class={format!("flex flex-col gap-8 border border-primary rounded-md p-4 {start}")}>
            <h1 class="text-2xl font-semibold">{props.title.clone()}</h1>
            <div class={props.class.clone()}>
                {props.children.clone()}
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct TableProps {
    #[prop_or_default]
    pub class: Classes,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Table)]
fn table(props: &TableProps) -> Html {
    html! {
        <table class={classes!("table", "tighter", "borderless", props.class.clone())}>
            <tbody>
                {props.children.clone()}
            </tbody>
        </table>
    }
}

#[derive(Properties, PartialEq)]
struct TableRowProps {
    #[prop_or_default]
    pub title: Option<AttrValue>,
    #[prop_or_default]
    pub error: bool,
    pub value: f64,
    #[prop_or_default]
    pub places: usize,
    #[prop_or_default]
    pub currency: Option<Currency>,
    #[prop_or_default]
    pub suffix: Option<AttrValue>,
    #[prop_or_default]
    pub tooltip_position: TooltipPosition,
    #[prop_or_default]
    pub children: Children,
}

#[function_component(TableRow)]
fn table_row(props: &TableRowProps) -> Html {
    let title = if let Some(title) = &props.title {
        html! {
            <th class="text-left">{title}</th>
        }
    } else {
        html! {
            <th />
        }
    };

    let number = format_number(
        props.value,
        true,
        props.places,
        props.currency.as_ref().map(Currency::symbol),
        props.suffix.as_deref(),
    )
    .expect("format_number");

    let tooltip = if props.children.is_empty() {
        html! {}
    } else {
        html! {
            <Tooltip position={props.tooltip_position}>
                {props.children.clone()}
            </Tooltip>
        }
    };

    html! {
        <tr class={classes!(if props.error { "text-red-500" } else { "" })}>
            {title}
            <td class="text-right">
                {number}
                {tooltip}
            </td>
        </tr>
    }
}

#[function_component(AccountInfo)]
fn account_info() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let currency_change = {
        let account = account.clone();
        Callback::from(move |currency| {
            account.dispatch(AccountAction::SetCurrency { currency });
        })
    };

    let amount_change = {
        let account = account.clone();
        Callback::from(move |amount| {
            if let Some(amount) = amount {
                account.dispatch(AccountAction::SetAmount { amount });
            }
        })
    };

    let margin_risk_change = {
        let account = account.clone();
        Callback::from(move |risk| {
            if let Some(risk) = risk {
                account.dispatch(AccountAction::SetMarginRisk { risk: risk / 100.0 });
            }
        })
    };

    let position_risk_change = {
        let account = account.clone();
        Callback::from(move |risk| {
            if let Some(risk) = risk {
                account.dispatch(AccountAction::SetPositionRisk { risk: risk / 100.0 });
            }
        })
    };

    let places_change = {
        let account = account.clone();
        Callback::from(move |places| {
            if let Some(places) = places {
                let places = places as usize;
                account.dispatch(AccountAction::SetPlaces { places });
            }
        })
    };

    let pc = account.currency != position.position_currency;
    let qc = position.position_currency != position.quote_currency;

    html! {
        <Panel title="Account Information" class="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
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
            if pc || qc {
                <div class="table">
                    <table class="table tighter">
                        <thead>
                            <tr>
                                <th>{"Currency Pair"}</th>
                                <th>{"Exchange Rate"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            if pc {
                                <tr>
                                    <td>
                                        {format!("{}{}",
                                                 account.currency,
                                                 position.position_currency)}
                                    </td>
                                    <td class="text-right">
                                        {format_number(
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
                                        .expect("format_number")}
                                    </td>
                                </tr>
                            }
                            if qc {
                                <tr>
                                    <td>
                                        {format!("{}{}",
                                                 position.position_currency,
                                                 position.quote_currency)}
                                    </td>
                                    <td class="text-right">
                                        {format_number(
                                            position.conversion,
                                            false,
                                            account.places,
                                            Some(position.quote_currency.symbol()),
                                            None
                                        )
                                        .expect("format_number")}
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }
        </Panel>
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

    let position_margin = if position.margin != 0.0 {
        format!("Position Margin ({:.0}x leverage)", 1.0 / position.margin)
    } else {
        "Position Margin".to_string()
    };

    html! {
        <Panel title="Position Information" class="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div class="grid grid-cols-2 gap-4">
                <Label title="Position">
                    <CurrencySelect
                        value={position.position_currency}
                        onchange={position_currency_change} />
                </Label>
                <Label title="Quote">
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
                        class="w-full"
                        value={position.quantity.unwrap_or_default()}
                        thousands={true}
                        places={4}
                        suffix=" units"
                        disabled={position.quantity.is_none()}
                        oninput={quantity_change} />
                </div>
            </Label>
            <div class="grid grid-flow-col justify-stretch gap-2 pt-7">
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
                        class="w-full"
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
                        class="w-full"
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
        </Panel>
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

    let qc = position.quote_currency.symbol();
    let ap = account.currency != position.position_currency;
    let pq = position.position_currency != position.quote_currency;

    let margin_fmt =
        format_number(position.margin * 100.0, true, 2, None, Some("%")).expect("format_number");
    let quantity_fmt = format_number(
        position.quantity.unwrap_or_default(),
        true,
        2,
        None,
        Some(" units"),
    )
    .expect("format_number");
    let open_price_fmt = format_number(position.open_price, true, account.places, Some(qc), None)
        .expect("format_number");

    let actual = if let Some(actual) = actual {
        let excess_risk = (actual.margin * 100.0).round() > account.margin_risk * 100.0;

        html! {
            <>
                <TableRow
                    title="Actual Quantity"
                    value={position.quantity.unwrap_or_default()}
                    places={2}
                    suffix={Some(" units")}>
                    {"Quantity entered into the position form."}
                </TableRow>
                <TableRow
                    title="Actual Cost"
                    value={position.quantity.unwrap_or_default() * position.open_price}
                    places={account.places}
                    currency={position.quote_currency}>
                    {"Actual cost of opening a position of "}
                    {&quantity_fmt}
                    {" units at "}
                    {&open_price_fmt}
                </TableRow>
                <TableRow
                    title="Required Margin"
                    value={actual.cost_quote}
                    places={account.places}
                    currency={position.quote_currency}>
                    {"Amount required at "}
                    {&margin_fmt}
                    {format!(" position margin ({:.0}x leverage)",
                            1.0 / if position.margin == 0.0 {
                                1.0
                            } else {
                                position.margin
                            },
                    )}
                </TableRow>

                if pq {
                    <TableRow
                        value={actual.cost_position}
                        places={account.places}
                        currency={position.position_currency}>
                        {"Amount required at "}
                        {format_number(
                            position.margin * 100.0, true,
                            2, None, Some("%")
                        ).expect("format_number")}
                        {" margin, converted into the position currency."}
                    </TableRow>
                }
                if ap {
                    <TableRow
                        value={actual.cost}
                        places={account.places}
                        currency={account.currency}>
                        {"Amount required at "}
                        {&margin_fmt}
                        {" margin, converted into the account currency."}
                    </TableRow>
                }

                <TableRow
                    title="Committed Account"
                    value={actual.margin * 100.0}
                    places={2}
                    suffix={Some("%")}
                    error={excess_risk}>
                    {"The percentage of the account that will be committed as margin to open the position."}
                </TableRow>
                if excess_risk {
                    <tr class="text-red-500">
                        <th colspan="2" class="text-left font-normal">
                            {"Actual quantity of "}
                            {&quantity_fmt}
                            {" exceeds account margin risk of "}
                            {format_number(
                                account.margin_risk * 100.0, true,
                                2, None, Some("%")
                            ).expect("format_number")}
                            {" by "}
                            {format_number(
                                actual.cost - available, true,
                                account.places, Some(account.currency.symbol()), None
                            ).expect("format_number")}
                            {"."}
                        </th>
                    </tr>
                }
            </>
        }
    } else {
        html! {}
    };

    html! {
        <Panel title="Position Size Information">
            <Table>
                <TableRow
                    title="Available Account"
                    value={available}
                    places={account.places}
                    currency={account.currency}>
                    {"Amount of account available under margin risk in the account currency."}
                </TableRow>

                if ap {
                    <TableRow
                        value={available_position}
                        places={account.places}
                        currency={position.position_currency}>
                        {"Amount of account available under margin risk in the position currency"}
                    </TableRow>
                }
                if pq {
                    <TableRow
                        value={available_quote}
                        places={account.places}
                        currency={position.quote_currency}>
                        {"Amount of account available under margin risk in the quote currency"}
                    </TableRow>
                }

                <TableRow
                    title="Available Margin"
                    value={margin}
                    places={account.places}
                    currency={account.currency}>
                    {"Available amount with a "}
                    {&margin_fmt}
                    {" position margin."}
                </TableRow>
                if ap {
                    <TableRow
                        value={margin_position}
                        places={account.places}
                        currency={position.position_currency}>
                        {"Available amount with a "}
                        {&margin_fmt}
                        {" position margin converted to position currency."}
                    </TableRow>
                }
                if pq {
                    <TableRow
                        value={margin_quote}
                        places={account.places}
                        currency={position.quote_currency}>
                        {"Available amount with a "}
                        {&margin_fmt}
                        {" position margin converted to quote currency."}
                    </TableRow>
                }

                <TableRow
                    title="Affordable Quantity"
                    value={affordable}
                    places={2}
                    suffix={Some(" units")}>
                    {"Position size  that can be taken at an open price of "}
                    {&open_price_fmt}
                    {" with available margin of "}
                    {format_number(
                            margin_quote, true,
                            account.places, Some(qc), None
                    ).expect("format_number")}
                </TableRow>
                {actual}
            </Table>
        </Panel>
    }
}

#[function_component(ReportStopLoss)]
fn report_stop_loss() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let ac = account.currency.symbol();
    let qc = position.quote_currency.symbol();
    let ap = account.currency != position.position_currency;
    let pq = position.position_currency != position.quote_currency;

    let position_risk_fmt = format_number(account.position_risk * 100.0, true, 2, None, Some("%"))
        .expect("format_number");
    let quantity_fmt = format_number(
        position.quantity.unwrap_or_default(),
        true,
        2,
        None,
        Some(" units"),
    )
    .expect("format_number");
    let open_price_fmt = format_number(position.open_price, true, account.places, Some(qc), None)
        .expect("format_number");

    let quantity = position.quantity.unwrap_or_else(|| {
        let PositionSize { affordable, .. } = PositionSize::compute(&account, &position);
        affordable
    });

    let StopLoss {
        available,
        available_position,
        available_quote,
        distance,
        actual,
        ..
    } = StopLoss::compute(&account, &position, quantity);

    let actual = if let Some(ActualStopLoss {
        distance,
        loss,
        risk,
    }) = actual
    {
        let excess_risk = (risk * 100.0).round() > account.position_risk * 100.0;
        let stop_loss_fmt = format_number(
            position.stop_loss.unwrap_or_default(),
            true,
            account.places,
            Some(qc),
            None,
        )
        .expect("format_number");

        html! {
            <>
                <tr />
                <TableRow
                    title="Actual Distance"
                    value={distance}
                    places={account.places}
                    currency={position.position_currency}>
                    {"The distance provided in the position form."}
                </TableRow>
                <TableRow
                    title="Actual Loss"
                    value={loss}
                    places={account.places}
                    currency={account.currency}>
                    {"The actual account loss that will be incurred should the "}
                    {"position close at the provided stop loss position of "}
                    {&stop_loss_fmt}
                    {"."}
                </TableRow>
                <TableRow
                    title="Actual Risk"
                    error={excess_risk}
                    value={risk * 100.0}
                    places={2}
                    suffix={Some("%")}>
                    {"Percentage of account at risk for the provided stop loss position of "}
                    {&stop_loss_fmt}
                    {"."}
                </TableRow>
                if excess_risk {
                    <tr class="text-red-500">
                        <th colspan="2" class="text-left font-normal">
                            {"Actual stop loss of "}
                            {&stop_loss_fmt}
                            {" exceeds account position risk of "}
                            {&position_risk_fmt}
                            {" by "}
                            {format_number(
                                loss - available, true,
                                account.places, Some(ac), None
                            ).expect("format_number")}
                        </th>
                    </tr>
                }
            </>
        }
    } else {
        html! {}
    };

    html! {
        <Panel title="Stop Loss Position" class="flex flex-col gap-4">
            <Table>
                <TableRow
                    title="Available Account"
                    value={available}
                    places={account.places}
                    currency={account.currency}>
                    {"Amount of account available under position risk of "}
                    {&position_risk_fmt}
                    {"."}
                </TableRow>
                if ap {
                    <TableRow
                        value={available_position}
                        places={account.places}
                        currency={position.position_currency}>
                        {"Amount of account available under position risk of "}
                        {&position_risk_fmt}
                        {" in the position currency."}
                    </TableRow>
                }
                if pq {
                    <TableRow
                        value={available_quote}
                        places={account.places}
                        currency={position.quote_currency}>
                        {"Amount of account available under position risk of "}
                        {&position_risk_fmt}
                        {" in the quote currency."}
                    </TableRow>
                }

                <TableRow
                    title="Maximum Stop Loss Price Distance"
                    value={distance}
                    places={account.places}
                    currency={position.position_currency}>
                    {"The maximum stop loss distance for a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&open_price_fmt}
                    {" to remain within the position risk of "}
                    {&position_risk_fmt}
                    {" of the account."}
                </TableRow>

                <TableRow
                    title="Maximum Stop Loss"
                    value={match position.direction {
                        Direction::Buy => position.open_price - distance,
                        Direction::Sell => position.open_price + distance
                    }}
                    places={account.places}
                    currency={position.position_currency}>
                    {"The maximum stop loss for a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&open_price_fmt}
                    {" to remain within the position risk of "}
                    {&position_risk_fmt}
                    {" of the account."}
                </TableRow>
                {actual}
            </Table>
            <p class="text-neutral-500 text-sm">
                {"This panel shows the maximum available stop loss, given the "}
                {position.quantity.map(|_| "specified").unwrap_or("calculated")}
                {" position size of "}
                {&quantity_fmt}
                {", and the account position risk."}
            </p>
        </Panel>
    }
}

#[function_component(ReportPlannedStopLoss)]
fn report_planned_stop_loss() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let Some(_) = position.stop_loss else {
        return html! {}
    };

    let qc = position.quote_currency.symbol();
    let ap = account.currency != position.position_currency;
    let pq = position.position_currency != position.quote_currency;

    let position_risk_fmt = format_number(account.position_risk * 100.0, true, 2, None, Some("%"))
        .expect("format_number");
    let margin_fmt =
        format_number(position.margin * 100.0, true, 2, None, Some("%")).expect("format_number");
    let leverage_fmt = format!(" ({:.0}x leverage).", 1.0 / position.margin);
    let quantity_fmt = format_number(
        position.quantity.unwrap_or_default(),
        true,
        2,
        None,
        Some(" units"),
    )
    .expect("format_number");
    let open_price_fmt = format_number(position.open_price, true, account.places, Some(qc), None)
        .expect("format_number");

    let StopLossQuantity {
        available,
        available_position,
        available_quote,
        distance,
        affordable,
        margin,
    } = StopLossQuantity::compute(&account, &position);

    let margin = if distance != 0.0 {
        html! {
            <>
                <TableRow
                    title="Required Margin"
                    value={margin}
                    places={account.places}
                    currency={account.currency}>
                    {"The amount of account margin that will be committted to "}
                    {"open a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&open_price_fmt}
                    {" with a position margin of "}
                    {&margin_fmt}
                    {&leverage_fmt}
                </TableRow>

                <TableRow
                    value={(margin / account.amount) * 100.0}
                    places={2}
                    suffix={Some("%")}>
                    {"The amount of account margin, as a percentage of the account "}
                    {"value, that will be committed to opening a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&open_price_fmt}
                    {" with a position margin of "}
                    {&margin_fmt}
                    {&leverage_fmt}
                </TableRow>
            </>
        }
    } else {
        html! {}
    };

    html! {
        <Panel title="Planned Stop Loss Maximum" skip={true} class="flex flex-col gap-4">
            <Table>
                <TableRow
                    title="Available Account"
                    value={available}
                    places={account.places}
                    currency={account.currency}>
                    {"Amount of account available under position risk of "}
                    {&position_risk_fmt}
                    {"."}
                </TableRow>
                if ap {
                    <TableRow
                        value={available_position}
                        places={account.places}
                        currency={position.position_currency}>
                        {"Amount of account available under position risk of "}
                        {&position_risk_fmt}
                        {"in the position currency."}
                    </TableRow>
                }
                if pq {
                    <TableRow
                        value={available_quote}
                        places={account.places}
                        currency={position.quote_currency}>
                        {"Amount of account available under position risk of "}
                        {&position_risk_fmt}
                        {"in the quote currency."}
                    </TableRow>
                }

                <TableRow
                    title="Stop Loss"
                    value={position.stop_loss.unwrap_or_default()}
                    places={account.places}
                    currency={position.position_currency}>
                    {"Stop loss entered in the position form."}
                </TableRow>
                <TableRow
                    title="Stop Loss Distance"
                    value={distance}
                    places={account.places}
                    currency={position.position_currency}>
                    {"Stop loss distance entered into the position form."}
                </TableRow>
                <TableRow
                    title="Available Quantity"
                    value={affordable}
                    places={2}
                    suffix={Some(" units")}>
                    {"The position size that can be taken at an open price of "}
                    {format_number(
                        position.open_price, true,
                        account.places, Some(qc), None
                    ).expect("format_number")}
                    {", given an account position risk of "}
                    {&position_risk_fmt}
                </TableRow>
                {margin}
            </Table>
            <p class="text-neutral-500 text-sm">
                {"This pannel shows the maximum position size available, given "}
                {"the entered position stop loss and the account position risk."}
            </p>
        </Panel>
    }
}

#[function_component(ReportTakeProfit)]
fn report_take_profit() -> Html {
    let account = use_context::<AccountHandle>().expect("AccountHandle");
    let position = use_context::<PositionHandle>().expect("PositionHandle");

    let Some(tp) = position.take_profit else {
        return html! {}
    };

    let pc = position.position_currency.symbol();

    let tp_fmt = format_number(tp, true, account.places, Some(pc), None).expect("format_number");
    let quantity_fmt = format_number(
        position.quantity.unwrap_or_default(),
        true,
        2,
        None,
        Some(" units"),
    )
    .expect("format_number");

    let tp_distance = match position.direction {
        Direction::Buy => tp - position.open_price,
        Direction::Sell => position.open_price - tp,
    };

    let sl_ratio = if let Some(sl) = position.stop_loss {
        tp_distance
            / match position.direction {
                Direction::Buy => position.open_price - sl,
                Direction::Sell => sl - position.open_price,
            }
    } else {
        0.0
    };

    let realized = (tp - position.open_price) * position.quantity.unwrap_or_default();
    let realized_account = realized
        / (position.conversion
            * account
                .exchange_rates
                .rates
                .get(&position.position_currency)
                .copied()
                .unwrap_or(1.0));

    html! {
        <Panel title="Take Profit" class="flex flex-col gap-4">
            <Table>
                <TableRow
                    title="Take Profit"
                    value={tp}
                    places={account.places}
                    currency={position.position_currency}>
                    {"Take profit entered in the position form."}
                </TableRow>
                <TableRow
                    title="Take Profit Distance"
                    value={tp_distance}
                    places={account.places}
                    currency={position.position_currency}>
                    {"Take profit distance, based on take profit entered in the position form."}
                </TableRow>
                if position.stop_loss.is_some() {
                    <TableRow
                        title="Ratio to Stop Loss"
                        error={sl_ratio < 2.0}
                        value={sl_ratio * 100.0}
                        places={2}
                        suffix={Some("%")}>
                        {"The ratio of the take profit distance to the stop loss distance"}
                    </TableRow>
                    if sl_ratio < 2.0 {
                        <tr class="text-red-500">
                            <th colspan="2" class="text-left font-normal">
                                {"A profit/loss ratio of "}
                                {format!("{:.0}%", sl_ratio * 100.0)}
                                {" is below the recommended minimum of 2:1."}
                            </th>
                        </tr>
                    }
                }

                <TableRow
                    title="Total Profit"
                    value={realized}
                    places={account.places}
                    currency={position.position_currency}>
                    {"Total realized profit if closing a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&tp_fmt}
                </TableRow>
                <TableRow
                    title="Realized Profit"
                    value={realized_account}
                    places={account.places}
                    currency={account.currency}>
                    {"Total realized account profit if closing a position of "}
                    {&quantity_fmt}
                    {" at "}
                    {&tp_fmt}
                </TableRow>
            </Table>
        </Panel>
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

    {
        let account_inner = account.clone();
        use_effect_with_deps(
            move |_| {
                account_inner.dispatch(AccountAction::Load);
                get_exchange_rates.run();
            },
            account.currency,
        );
    }

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
                <ClientOnly>
                    <div class="container mx-auto my-8">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <AccountInfo />
                            <PositionInfo />
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <ReportPositionSize />
                            <ReportStopLoss />
                            <ReportTakeProfit />
                            <ReportPlannedStopLoss />
                        </div>
                    </div>
                </ClientOnly>
            </PositionProvider>
        </AccountProvider>
    }
}
