use std::rc::Rc;

use gloo::storage::Storage;
use serde::Deserialize;
use wasm_bindgen::JsCast;
use web_sys::{HtmlInputElement, InputEvent, SubmitEvent};
use yew::{
    function_component, html, use_effect_with_deps, use_reducer, Callback, Children,
    ContextProvider, Html, Properties, Reducible, UseReducerHandle,
};
use yew_hooks::{use_async, use_async_with_options, use_interval, UseAsyncHandle, UseAsyncOptions};
use yew_icons::{Icon, IconId};

use crate::components::analytics::get_analytics_host;

#[derive(Debug, Clone, PartialEq)]
enum AuthState {
    // There is no authentication information
    Empty,
    // The user needs to sign in
    SignIn,
    // We have a stored authentication token that we want to validate.
    Validating { token: String },
    // We have a valid authentication token.
    Valid { token: String },
}

enum AuthStateAction {
    LoadStoredToken,
    UseToken(String),
    Clear,
}

const STORED_TOKEN_ID: &str = "blakerain-analytics-token";

impl AuthState {
    pub fn new() -> Self {
        Self::Empty
    }

    pub fn get_stored_token() -> Option<String> {
        use gloo::storage::errors::StorageError;

        match gloo::storage::LocalStorage::get(STORED_TOKEN_ID) {
            Ok(token) => Some(token),
            Err(err) => match err {
                StorageError::KeyNotFound(_) => None,
                StorageError::SerdeError(err) => {
                    log::error!("Failed to deserialize stored authentication token: {err:?}");
                    Self::remove_stored_token();
                    None
                }

                StorageError::JsError(err) => {
                    log::info!("Failed to load stored authentication token: {err:?}");
                    None
                }
            },
        }
    }

    pub fn set_stored_token(token: &str) {
        gloo::storage::LocalStorage::set(STORED_TOKEN_ID, token)
            .expect("SessionStorage to be writable")
    }

    pub fn remove_stored_token() {
        gloo::storage::LocalStorage::delete(STORED_TOKEN_ID)
    }
}

impl Reducible for AuthState {
    type Action = AuthStateAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        match action {
            AuthStateAction::LoadStoredToken => {
                if let Some(token) = Self::get_stored_token() {
                    Self::Validating { token }
                } else {
                    Self::SignIn
                }
            }

            AuthStateAction::UseToken(token) => {
                Self::set_stored_token(&token);
                Self::Valid { token }
            }

            AuthStateAction::Clear => {
                Self::remove_stored_token();
                Self::SignIn
            }
        }
        .into()
    }
}

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum SignInResponse {
    InvalidCredentials,
    NewPassword,
    Successful { token: String },
}

#[derive(Deserialize)]
#[serde(tag = "type")]
pub enum ValidateTokenResponse {
    Invalid,
    Valid { token: String },
}

#[derive(Debug, Clone, PartialEq)]
pub struct AuthTokenContext(pub String);

#[derive(Properties, PartialEq)]
pub struct WithAuthProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(WithAuth)]
pub fn with_auth(props: &WithAuthProps) -> Html {
    let host = get_analytics_host();
    let state = use_reducer(AuthState::new);

    let submission: UseAsyncHandle<(), &'static str> = {
        // If we have a token already in our state, then we want to validate it automatically.
        let options = if let AuthState::Validating { .. } = *state {
            UseAsyncOptions::enable_auto()
        } else {
            UseAsyncOptions::default()
        };

        let host = host.clone();
        let state = state.clone();

        use_async_with_options(
            async move {
                if let AuthState::Validating { token } = &*state {
                    log::info!("Validating and regenerating authentication token");

                    let res = reqwest::Client::new()
                        .post(format!("{host}auth/validate"))
                        .json(&serde_json::json!({
                            "token": token
                        }))
                        .send()
                        .await
                        .map_err(|err| {
                            log::error!(
                                "Unable to validate analytics authentication token: {err:?}"
                            );
                            "Unable to validate analytics authentication token"
                        })?;

                    let res = res.json::<ValidateTokenResponse>().await.map_err(|err| {
                        log::error!("Unable to parse analytics token validation response: {err:?}");
                        "Unable to parse analytics token validation response"
                    })?;

                    match res {
                        ValidateTokenResponse::Invalid => {
                            log::error!("Stored token was invalid; clearing state");
                            state.dispatch(AuthStateAction::Clear);
                        }

                        ValidateTokenResponse::Valid { token } => {
                            log::info!("Stored token was valid and regenerated");
                            state.dispatch(AuthStateAction::UseToken(token))
                        }
                    }
                } else {
                    log::warn!("No analytics token was present to validate");
                }

                Ok(())
            },
            options,
        )
    };

    {
        let deps_state = state.clone();
        let state = state.clone();
        let submission = submission.clone();

        use_effect_with_deps(
            move |_| {
                if let AuthState::Empty = *state {
                    state.dispatch(AuthStateAction::LoadStoredToken);
                    submission.run();
                }
            },
            (*deps_state).clone(),
        );
    }

    // Every five minutes: refresh and revalidate the token.
    use_interval(move || submission.run(), 5 * 60 * 1000);

    match &*state {
        AuthState::Empty => {
            html! {}
        }

        AuthState::SignIn => {
            html! {
                <SignIn host={host.clone()} state={state} />
            }
        }

        AuthState::Validating { .. } => {
            html! {
                <div class="container mx-auto my-10">
                    <b class="text-xl font-semibold text-center">{"Validating Authentication ..."}</b>
                </div>
            }
        }

        AuthState::Valid { token } => {
            html! {
                <ContextProvider<AuthTokenContext> context={AuthTokenContext(token.clone())}>
                    {props.children.clone()}
                </ContextProvider<AuthTokenContext>>
            }
        }
    }
}

#[derive(Properties, PartialEq)]
struct AuthContainerProps {
    title: String,
    message: Option<String>,
    error: Option<String>,
    #[prop_or_default]
    children: Children,
}

#[function_component(AuthContainer)]
fn auth_container(
    AuthContainerProps {
        title,
        message,
        error,
        children,
    }: &AuthContainerProps,
) -> Html {
    html! {
        <div class="container mx-auto my-10 flex flex-row justify-center">
            <div class="flex flex-col gap-4 basis-full md:basis-2/3 lg:basis-1/2 xl:basis-1/3 p-4">
                <div>
                    <h1 class="text-xl font-semibold">{title}</h1>
                    if let Some(message) = message {
                        <h2>{message}</h2>
                    }
                </div>
                if let Some(error) = error {
                    <h2 class="dark:text-red-500 text-red-700">{error}</h2>
                }
                {children.clone()}
            </div>
        </div>
    }
}

#[derive(Properties, PartialEq)]
struct SignInProps {
    pub host: String,
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
fn sign_in(SignInProps { host, state }: &SignInProps) -> Html {
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
        let host = host.clone();
        let state = state.clone();
        let sign_in_state = sign_in_state.clone();

        let payload = if let Some(new_password) = &sign_in_state.new_password {
            serde_json::json!({
                "username": sign_in_state.username,
                "oldPassword": sign_in_state.password,
                "newPassword": new_password
            })
        } else {
            serde_json::json!({
                "username": sign_in_state.username,
                "password": sign_in_state.password
            })
        };

        use_async(async move {
            {
                let res = reqwest::Client::new()
                    .post(if sign_in_state.new_password.is_some() {
                        format!("{host}auth/new_password")
                    } else {
                        format!("{host}auth/sign_in")
                    })
                    .json(&payload)
                    .send()
                    .await
                    .map_err(|err| {
                        log::error!("Failed to send authentication request: {err:?}");
                        "Error communicating with authentication server"
                    })?;

                let res = res.json::<SignInResponse>().await.map_err(|err| {
                    log::error!("Failed to decode sign in response: {err:?}");
                    "Error communicating with authentication server"
                })?;

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
