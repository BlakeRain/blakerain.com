use time::{Duration, OffsetDateTime};

#[derive(Clone)]
pub enum VisibilityState {
    Unknown,
    Visible {
        total_hidden: Duration,
    },
    Hidden {
        total: Duration,
        start: OffsetDateTime,
    },
}

impl Default for VisibilityState {
    fn default() -> Self {
        Self::Unknown
    }
}

impl VisibilityState {
    pub fn from_document() -> Self {
        let hidden = gloo::utils::window().document().expect("document").hidden();

        if hidden {
            VisibilityState::Hidden {
                total: Duration::new(0, 0),
                start: OffsetDateTime::now_utc(),
            }
        } else {
            VisibilityState::Visible {
                total_hidden: Duration::new(0, 0),
            }
        }
    }

    pub fn to_visible(&self) -> Self {
        match self {
            Self::Unknown => Self::Visible {
                total_hidden: Duration::new(0, 0),
            },

            Self::Hidden { total, start } => {
                let hidden = OffsetDateTime::now_utc() - *start;
                let total_hidden = *total + hidden;

                log::info!(
                    "Page is now visible; was hidden for {} second(s) ({} total)",
                    hidden.whole_seconds(),
                    total_hidden.whole_seconds(),
                );

                Self::Visible { total_hidden }
            }

            Self::Visible { .. } => self.clone(),
        }
    }

    pub fn to_hidden(&self) -> Self {
        match self {
            Self::Unknown => Self::Hidden {
                total: Duration::new(0, 0),
                start: OffsetDateTime::now_utc(),
            },

            Self::Hidden { .. } => self.clone(),

            Self::Visible {
                total_hidden: hidden,
            } => Self::Hidden {
                total: *hidden,
                start: OffsetDateTime::now_utc(),
            },
        }
    }
}
