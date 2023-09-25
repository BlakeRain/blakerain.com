use web_sys::HtmlSelectElement;
use yew::{function_component, html, Callback, Html, Properties, TargetCast};

use crate::model::currency::{Currency, CURRENCIES};

#[derive(Properties, PartialEq)]
pub struct CurrencySelectProps {
    pub value: Currency,
    pub onchange: Callback<Currency>,
}

#[function_component(CurrencySelect)]
pub fn currency_select(props: &CurrencySelectProps) -> Html {
    let onchange = {
        let onchange = props.onchange.clone();

        Callback::from(move |event: yew::Event| {
            onchange.emit(
                event
                    .target_dyn_into::<HtmlSelectElement>()
                    .expect("target")
                    .value()
                    .parse::<Currency>()
                    .expect("currency"),
            );
        })
    };

    html! {
        <select {onchange}>
            {
                for CURRENCIES.iter().map(|currency| html! {
                    <option value={currency.to_string()} selected={*currency == props.value}>
                        {currency.to_string()}
                    </option>
                })
            }
        </select>
    }
}
