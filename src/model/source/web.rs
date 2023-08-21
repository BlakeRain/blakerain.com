use async_trait::async_trait;

use crate::model::PostInfo;

use super::{ModelProvider, SourceError};

pub struct Source {}

impl Source {
    pub fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl ModelProvider for Source {
    async fn get_posts(&self) -> Result<Vec<PostInfo>, SourceError> {
        todo!()
    }
}
