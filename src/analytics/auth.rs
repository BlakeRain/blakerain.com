use yew::{
    function_component, html, use_effect_with_deps, use_reducer, Children, ContextProvider, Html,
    Properties,
};
use yew_hooks::{use_async_with_options, use_interval, UseAsyncHandle, UseAsyncOptions};

pub mod api;
pub mod container;
pub mod sign_in;
pub mod state;

use self::{
    api::ValidateTokenResponse,
    sign_in::SignIn,
    state::{AuthState, AuthStateAction},
};

#[derive(Debug, Clone, PartialEq)]
pub struct AuthTokenContext(pub String);

#[derive(Properties, PartialEq)]
pub struct WithAuthProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(WithAuth)]
pub fn with_auth(props: &WithAuthProps) -> Html {
    let state = use_reducer(AuthState::default);

    let submission: UseAsyncHandle<(), &'static str> = {
        // If we have a token already in our state, then we want to validate it automatically.
        let options = if let AuthState::Validating { .. } = *state {
            UseAsyncOptions::enable_auto()
        } else {
            UseAsyncOptions::default()
        };

        let state = state.clone();
        use_async_with_options(
            async move {
                if let AuthState::Validating { token } = &*state {
                    log::info!("Validating and regenerating authentication token");

                    match api::validate(token).await? {
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
                <SignIn state={state} />
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
