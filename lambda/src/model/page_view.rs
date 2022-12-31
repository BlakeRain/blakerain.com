use std::collections::HashMap;

use aws_sdk_dynamodb::model::AttributeValue;
use lambda_http::aws_lambda_events::query_map::QueryMap;
use time::OffsetDateTime;

use super::dynamodb::{
    attribute::{get_attr, get_attr_opt, Attribute},
    item::{FromItem, FromItemError, ToItem},
};

pub struct PageView {
    pub path: String,
    pub section: String,
    pub time: OffsetDateTime,
    pub user_agent: Option<String>,
    pub viewport_width: Option<i32>,
    pub viewport_height: Option<i32>,
    pub screen_width: Option<i32>,
    pub screen_height: Option<i32>,
    pub timezone: Option<String>,
    pub referrer: Option<String>,
    pub duration: Option<i32>,
    pub scroll: Option<i32>,
}

impl PageView {
    pub fn from_querystring(query: QueryMap) -> Option<Self> {
        let uuid = query.first("uuid")?;
        let path = query.first("path")?;

        Some(PageView {
            path: path.to_string(),
            section: format!("view-{}", uuid),
            time: OffsetDateTime::now_utc(),
            user_agent: query.first("ua").map(ToString::to_string),
            viewport_width: query
                .first("viewport_width")
                .and_then(|value| value.parse().ok()),
            viewport_height: query
                .first("viewport_height")
                .and_then(|value| value.parse().ok()),
            screen_width: query
                .first("screen_width")
                .and_then(|value| value.parse().ok()),
            screen_height: query
                .first("viewport_height")
                .and_then(|value| value.parse().ok()),
            timezone: query.first("tz").map(ToString::to_string),
            referrer: query.first("referrer").map(ToString::to_string),
            duration: query.first("duration").and_then(|value| value.parse().ok()),
            scroll: query.first("scroll").and_then(|value| value.parse().ok()),
        })
    }
}

impl ToItem for PageView {
    fn to_item(self) -> HashMap<String, AttributeValue> {
        let mut item = HashMap::new();

        item.insert("Path".to_string(), self.path.into_attr());
        item.insert("Section".to_string(), self.section.into_attr());
        item.insert("Time".to_string(), self.time.into_attr());

        if let Some(ua) = self.user_agent {
            item.insert("UserAgent".to_string(), ua.into_attr());
        }

        if let Some(viewport_width) = self.viewport_width {
            item.insert("ViewportWidth".to_string(), viewport_width.into_attr());
        }

        if let Some(viewport_height) = self.viewport_height {
            item.insert("ViewportHeight".to_string(), viewport_height.into_attr());
        }

        if let Some(screen_width) = self.screen_width {
            item.insert("ScreenWidth".to_string(), screen_width.into_attr());
        }

        if let Some(screen_height) = self.screen_height {
            item.insert("ScreenHeight".to_string(), screen_height.into_attr());
        }

        if let Some(timezone) = self.timezone {
            item.insert("Timezone".to_string(), timezone.into_attr());
        }

        if let Some(referrer) = self.referrer {
            item.insert("Referrer".to_string(), referrer.into_attr());
        }

        if let Some(duration) = self.duration {
            item.insert("Duration".to_string(), duration.into_attr());
        }

        if let Some(scroll) = self.scroll {
            item.insert("Scroll".to_string(), scroll.into_attr());
        }

        item
    }
}

impl FromItem for PageView {
    fn from_item(mut item: HashMap<String, AttributeValue>) -> Result<Self, FromItemError> {
        let path = get_attr(&mut item, "Path")?;
        let section = get_attr(&mut item, "Section")?;
        let time = get_attr(&mut item, "Time")?;
        let user_agent = get_attr_opt(&mut item, "UserAgent")?;
        let viewport_width = get_attr_opt(&mut item, "ViewportWidth")?;
        let viewport_height = get_attr_opt(&mut item, "ViewportHeight")?;
        let screen_width = get_attr_opt(&mut item, "ScreenWidth")?;
        let screen_height = get_attr_opt(&mut item, "ScreenHeight")?;
        let timezone = get_attr_opt(&mut item, "Timezone")?;
        let referrer = get_attr_opt(&mut item, "Referrer")?;
        let duration = get_attr_opt(&mut item, "Duration")?;
        let scroll = get_attr_opt(&mut item, "Scroll")?;

        Ok(PageView {
            path,
            section,
            time,
            user_agent,
            viewport_width,
            viewport_height,
            screen_width,
            screen_height,
            timezone,
            referrer,
            duration,
            scroll,
        })
    }
}
