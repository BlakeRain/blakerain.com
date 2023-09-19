pub mod user;
pub mod view;
pub mod query;

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!();
