use lazy_static::lazy_static;
use time::OffsetDateTime;

pub mod app;
pub mod components;
pub mod model;
pub mod pages;

lazy_static! {
    static ref BUILD_TIME: OffsetDateTime = {
        OffsetDateTime::parse(
            env!("BUILD_TIME"),
            &time::format_description::well_known::Rfc2822,
        )
        .expect("time parse")
    };
}
