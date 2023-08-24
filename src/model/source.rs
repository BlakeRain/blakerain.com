#[cfg(feature = "hydration")]
mod hydrating;

#[cfg(feature = "hydration")]
pub use hydrating::*;

#[cfg(not(feature = "hydration"))]
mod filesystem;

use std::collections::HashMap;

#[cfg(not(feature = "hydration"))]
pub use filesystem::*;

use super::{PostInfo, Tag};

pub type TagsContext = HashMap<String, Tag>;
pub type PostsContext = Vec<PostInfo>;
