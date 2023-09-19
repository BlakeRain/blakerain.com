use std::rc::Rc;

use wasm_bindgen::JsCast;
use web_sys::{HtmlInputElement, InputEvent, SubmitEvent};
use yew::{
    function_component, html, use_reducer, Callback, Html, Properties, Reducible, UseReducerHandle,
};
use yew_hooks::{use_async, UseAsyncHandle};
use yew_icons::{Icon, IconId};

use super::{
    api::{self, SignInResponse},
    container::AuthContainer,
    state::{AuthState, AuthStateAction},
};

#[derive(Properties, PartialEq)]
pub struct SignInProps {
    pub state: UseReducerHandle<AuthState>,
}

#[derive(Clone)]
struct SignInState {
    processing: bool,
    message: &'static str,
    error: Option<String>,
    username: String,
    password: String,
    new_password: Option<String>,
    complete: bool,
}

enum SignInStateAction {
    SetProcessing,
    SetError(String),
    SetUsername(String),
    SetPassword(String),
    SetNewPassword(String),
    InvalidCredentials,
    RequireNewPassword,
}

impl SignInState {
    fn new() -> Self {
        Self {
            processing: false,
            message: "Sign in using your username and password",
            error: None,
            username: String::new(),
            password: String::new(),
            new_password: None,
            complete: false,
        }
    }

    fn is_complete(username: &String, password: &String, new_password: Option<&String>) -> bool {
        !username.is_empty()
            && !password.is_empty()
            && !new_password.map(String::is_empty).unwrap_or(false)
    }
}

impl Reducible for SignInState {
    type Action = SignInStateAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        match action {
            SignInStateAction::SetProcessing => Self {
                processing: true,
                ..(*self).clone()
            },

            SignInStateAction::SetError(error) => Self {
                error: Some(error),
                ..(*self).clone()
            },

            SignInStateAction::SetUsername(username) => Self {
                complete: Self::is_complete(&username, &self.password, self.new_password.as_ref()),
                username,
                ..(*self).clone()
            },

            SignInStateAction::SetPassword(password) => Self {
                complete: Self::is_complete(&self.username, &password, self.new_password.as_ref()),
                password,
                ..(*self).clone()
            },

            SignInStateAction::SetNewPassword(new_password) => Self {
                complete: Self::is_complete(&self.username, &self.password, Some(&new_password)),
                new_password: Some(new_password),
                ..(*self).clone()
            },

            SignInStateAction::InvalidCredentials => Self {
                processing: false,
                error: Some("Invalid username or password".to_string()),
                username: String::new(),
                password: String::new(),
                new_password: self.new_password.as_ref().map(|_| String::new()),
                complete: false,
                ..(*self).clone()
            },

            SignInStateAction::RequireNewPassword => Self {
                processing: false,
                message: "Please enter a new password",
                error: None,
                password: String::new(),
                new_password: Some(String::new()),
                complete: false,
                ..(*self).clone()
            },
        }
        .into()
    }
}

#[function_component(SignIn)]
pub fn sign_in(SignInProps { state }: &SignInProps) -> Html {
    let sign_in_state = use_reducer(SignInState::new);

    let username_change = {
        let sign_in_state = sign_in_state.clone();
        Callback::from(move |event: InputEvent| {
            let target = event
                .target()
                .expect("event target")
                .dyn_into::<HtmlInputElement>()
                .expect("input element");

            sign_in_state.dispatch(SignInStateAction::SetUsername(target.value()));
        })
    };

    let password_change = {
        let sign_in_state = sign_in_state.clone();
        Callback::from(move |event: InputEvent| {
            let target = event
                .target()
                .expect("event target")
                .dyn_into::<HtmlInputElement>()
                .expect("input element");

            sign_in_state.dispatch(SignInStateAction::SetPassword(target.value()));
        })
    };

    let new_password_change = {
        let sign_in_state = sign_in_state.clone();
        Callback::from(move |event: InputEvent| {
            let target = event
                .target()
                .expect("event target")
                .dyn_into::<HtmlInputElement>()
                .expect("input element");

            sign_in_state.dispatch(SignInStateAction::SetNewPassword(target.value()));
        })
    };

    let submit: UseAsyncHandle<(), &'static str> = {
        let state = state.clone();
        let sign_in_state = sign_in_state.clone();

        use_async(async move {
            {
                let res = if let Some(new_pwd) = &sign_in_state.new_password {
                    api::new_password(&sign_in_state.username, &sign_in_state.password, new_pwd)
                        .await?
                } else {
                    api::sign_in(&sign_in_state.username, &sign_in_state.password).await?
                };

                match res {
                    SignInResponse::InvalidCredentials => {
                        sign_in_state.dispatch(SignInStateAction::InvalidCredentials);
                    }

                    SignInResponse::NewPassword => {
                        sign_in_state.dispatch(SignInStateAction::RequireNewPassword);
                    }

                    SignInResponse::Successful { token } => {
                        state.dispatch(AuthStateAction::UseToken(token));
                    }
                }

                Ok(())
            }
            .map_err(|err: &'static str| {
                sign_in_state.dispatch(SignInStateAction::SetError(err.to_string()));
                err
            })
        })
    };

    let onsubmit = {
        let sign_in_state = sign_in_state.clone();

        Callback::from(move |event: SubmitEvent| {
            event.prevent_default();

            if !sign_in_state.complete {
                log::error!("Attempt to submit form without completing");
                return;
            }

            sign_in_state.dispatch(SignInStateAction::SetProcessing);
            submit.run()
        })
    };

    html! {
        <form {onsubmit}>
            <AuthContainer
                title="Sign In"
                message={Some(sign_in_state.message.to_string())}
                error={sign_in_state.error.clone()}>
                <div class="flex flex-col">
                    <label>{"Username"}</label>
                    <input
                        type="text"
                        placeholder="username"
                        disabled={sign_in_state.processing}
                        value={sign_in_state.username.clone()}
                        oninput={username_change} />
                </div>
                <div class="flex flex-col">
                    <label>{"Password"}</label>
                    <input
                        type="password"
                        placeholder="password"
                        disabled={sign_in_state.processing}
                        value={sign_in_state.password.clone()}
                        oninput={password_change} />
                </div>
                if let Some(new_password) = &sign_in_state.new_password {
                    <div class="flex flex-col">
                        <label>{"New Password"}</label>
                        <input
                            type="password"
                            placeholder="new password"
                            disabled={sign_in_state.processing}
                            value={new_password.clone()}
                            oninput={new_password_change} />
                    </div>
                }
                <button
                    type="submit"
                    class="button mt-4"
                    disabled={!sign_in_state.complete || sign_in_state.processing}>
                    <Icon icon_id={IconId::LucideCheck} />
                    {"Sign In"}
                </button>
            </AuthContainer>
        </form>
    }
}
