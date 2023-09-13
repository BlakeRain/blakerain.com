pub mod user;
pub mod view;

pub static MIGRATOR: sqlx::migrate::Migrator = sqlx::migrate!();
