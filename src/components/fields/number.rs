use wasm_bindgen::{prelude::wasm_bindgen, JsValue};
use web_sys::FocusEvent;
use yew::{
    classes, function_component, html, use_effect_with, use_node_ref, use_state, AttrValue,
    Callback, Classes, Html, Properties, TargetCast,
};
use yew_hooks::use_timeout;
use yew_icons::{Icon, IconId};

#[wasm_bindgen(module = "/public/format.js")]
extern "C" {
    #[wasm_bindgen(catch, js_name = formatNumber)]
    pub fn format_number(
        value: f64,
        thousands: bool,
        places: usize,
        prefix: Option<&str>,
        suffix: Option<&str>,
    ) -> Result<String, JsValue>;
}

#[derive(Properties, PartialEq)]
pub struct NumberProps {
    #[prop_or_default]
    pub icon_left: Option<IconId>,
    #[prop_or_default]
    pub icon_right: Option<IconId>,

    #[prop_or_default]
    pub icon_left_class: Option<Classes>,
    #[prop_or_default]
    pub icon_right_class: Option<Classes>,

    #[prop_or_default]
    pub class: Classes,
    #[prop_or_default]
    pub id: Option<AttrValue>,
    #[prop_or_default]
    pub name: Option<AttrValue>,
    #[prop_or_default]
    pub placeholder: Option<AttrValue>,

    #[prop_or_default]
    pub value: f64,

    #[prop_or_default]
    pub disabled: bool,
    #[prop_or_default]
    pub thousands: bool,
    #[prop_or_default]
    pub places: usize,
    #[prop_or_default]
    pub prefix: Option<AttrValue>,
    #[prop_or_default]
    pub suffix: Option<AttrValue>,

    #[prop_or_default]
    pub onfocus: Option<Callback<FocusEvent>>,
    #[prop_or_default]
    pub onblur: Option<Callback<FocusEvent>>,
    #[prop_or_default]
    pub onchange: Option<Callback<Option<f64>>>,
    #[prop_or_default]
    pub oninput: Option<Callback<Option<f64>>>,
}

#[function_component(Number)]
pub fn number(props: &NumberProps) -> Html {
    let mut classes = Classes::from("text-right");

    let icon_left = if let Some(icon) = props.icon_left {
        classes.push("icon-left");
        Some(html! {
            <Icon
                icon_id={icon}
                class={classes!("group-focus-within:text-indigo-300",
                                props.icon_left_class.clone())} />
        })
    } else {
        None
    };

    let icon_right = if let Some(icon) = props.icon_right {
        classes.push("icon-right");
        Some(html! {
            <Icon
                icon_id={icon}
                class={classes!("group-focus-within:text-indigo-300",
                                props.icon_right_class.clone())} />
        })
    } else {
        None
    };

    classes.extend(props.class.clone());

    let value = props.value;

    // Create a state variable that we will use to store the value that the user enters into the
    // input element. We use this so that we only need to validate input when the user focuses away
    // from the input (or presses <Enter>). The default value for this state is the initial value
    // of the number field, formatted for reasonable input.
    let input_value = {
        let places = props.places;
        use_state(move || {
            format_number(value, false, places, None, None).expect("format_numbert to work")
        })
    };

    // We need to keep track of whether the field is focused, which we do with this state variable.
    // When the user focuses and unfocuses the control, we toggle this state variable.
    let focused = use_state(|| false);

    // We also want to keep track of a reference to our <input> element, so that we can select the
    // text when the user focuses the input. Doing this in the event handler is not having the
    // desired effect without a small delay.
    let input_ref = use_node_ref();

    // When the value passed to this field changes, we want to update our state.
    {
        let input_value = input_value.clone();
        let focused = focused.clone();
        use_effect_with((value, props.places), move |(value, places)| {
            if !*focused {
                input_value.set(
                    format_number(*value, false, *places, None, None)
                        .expect("format_number to work"),
                );
            }
        });
    }

    let timeout = {
        let focused = focused.clone();
        let input_ref = input_ref.clone();

        use_timeout(
            move || {
                if *focused {
                    input_ref
                        .cast::<web_sys::HtmlInputElement>()
                        .expect("<input> not attached to reference")
                        .select();
                }
            },
            50,
        )
    };

    let parse_input = {
        let places = props.places;
        let input_value = input_value.clone();
        let onchange = props.onchange.clone();

        Callback::from(move |()| {
            let value = if let Ok(value) = (*input_value).parse::<f64>() {
                // Update the text value of the input to match our parsed number. We only format to
                // the desired number of places here, so we don't force the user to cursor around
                // formatting characters and thousand separators.
                input_value.set(
                    format_number(value, false, places, None, None)
                        .expect("Number formatting to work"),
                );

                Some(value)
            } else {
                None
            };

            if let Some(onchange) = &onchange {
                onchange.emit(value);
            }
        })
    };

    let onfocus = {
        let timeout = timeout.clone();
        let focused = focused.clone();

        Callback::from(move |_| {
            focused.set(true);
            timeout.reset();
        })
    };

    let onblur = {
        let focused = focused.clone();
        let parse_input = parse_input.clone();

        Callback::from(move |_| {
            focused.set(false);
            parse_input.emit(());
        })
    };

    let onchange = { Callback::from(move |_| parse_input.emit(())) };

    let oninput = {
        let input_value = input_value.clone();
        let oninput = props.oninput.clone();

        Callback::from(move |event: yew::InputEvent| {
            let Some(el) = event.target_dyn_into::<web_sys::HtmlInputElement>() else {
                log::error!("No <input> element found in event");
                return;
            };

            let value = el.value();
            input_value.set(value.clone());

            if let Some(oninput) = &oninput {
                oninput.emit(value.parse::<f64>().ok());
            }
        })
    };

    // If the field is focused, then we want to allow the user to work with their own value, as a
    // string. if the field is not focused, then we want to render the number value using the
    // prefix, suffix, thousands separator and places.
    let rendered = if *focused {
        (*input_value).clone()
    } else {
        format_number(
            value,
            props.thousands,
            props.places,
            props.prefix.as_deref(),
            props.suffix.as_deref(),
        )
        .expect("format_number to work")
    };

    let id = props.id.clone();
    let name = props.name.clone();
    let placeholder = props.placeholder.clone();

    let input = html! {
        <input
            ref={input_ref}
            class={classes}
            type="text"
            id={id}
            name={name}
            placeholder={placeholder}
            disabled={props.disabled}
            value={rendered}
            {onfocus}
            {onblur}
            {onchange}
            {oninput} />
    };

    if icon_left.is_some() || icon_right.is_some() {
        html! {
            <div class="input-icons group">
                {icon_left}
                {input}
                {icon_right}
            </div>
        }
    } else {
        input
    }
}
