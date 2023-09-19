use std::rc::Rc;

use gloo::storage::Storage;
use yew::Reducible;

#[derive(Debug, Clone, PartialEq)]
pub enum AuthState {
    // There is no authentication information
    Empty,
    // The user needs to sign in
    SignIn,
    // We have a stored authentication token that we want to validate.
    Validating { token: String },
    // We have a valid authentication token.
    Valid { token: String },
}

pub enum AuthStateAction {
    LoadStoredToken,
    UseToken(String),
    Clear,
}

const STORED_TOKEN_ID: &str = "blakerain-analytics-token";

impl Default for AuthState {
    fn default() -> Self {
        Self::Empty
    }
}

impl AuthState {
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
