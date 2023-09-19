use std::rc::Rc;

use time::{Duration, OffsetDateTime};
use uuid::Uuid;
use yew::Reducible;

use super::visibility::VisibilityState;

#[derive(Clone)]
pub struct AnalyticsState {
    view_id: Option<Uuid>,
    start: OffsetDateTime,
    scroll: f64,
    visibility: VisibilityState,
}

impl Default for AnalyticsState {
    fn default() -> Self {
        Self {
            view_id: None,
            start: OffsetDateTime::now_utc(),
            scroll: 0.0,
            visibility: VisibilityState::default(),
        }
    }
}

impl AnalyticsState {
    fn new_with_id(id: Uuid) -> Self {
        Self {
            view_id: Some(id),
            start: OffsetDateTime::now_utc(),
            scroll: super::bindings::get_position().clamp(0.0, 100.0),
            visibility: VisibilityState::from_document(),
        }
    }

    pub fn view_id(&self) -> Option<Uuid> {
        self.view_id
    }

    fn get_total_hidden(&self) -> Duration {
        match self.visibility {
            VisibilityState::Unknown => Duration::seconds(0),
            VisibilityState::Visible {
                total_hidden: hidden,
            } => hidden,
            VisibilityState::Hidden { total, start } => total + (OffsetDateTime::now_utc() - start),
        }
    }

    pub fn get_duration(&self) -> f64 {
        ((OffsetDateTime::now_utc() - self.start) - self.get_total_hidden())
            .abs()
            .clamp(Duration::new(0, 0), Duration::hours(2))
            .as_seconds_f64()
            .round()
    }

    pub fn get_scroll(&self) -> f64 {
        self.scroll
    }
}

pub enum AnalyticsAction {
    NewPageView(Uuid),
    SetScroll(f64),
    VisibilityChanged(bool),
}

impl Reducible for AnalyticsState {
    type Action = AnalyticsAction;

    fn reduce(self: Rc<Self>, action: Self::Action) -> Rc<Self> {
        match action {
            AnalyticsAction::NewPageView(id) => Self::new_with_id(id),

            AnalyticsAction::SetScroll(distance) => Self {
                scroll: self.scroll.max(distance),
                ..(*self).clone()
            },

            AnalyticsAction::VisibilityChanged(visible) => {
                let visibility = if visible {
                    self.visibility.to_visible()
                } else {
                    self.visibility.to_hidden()
                };

                Self {
                    visibility,
                    ..(*self).clone()
                }
            }
        }
        .into()
    }
}
