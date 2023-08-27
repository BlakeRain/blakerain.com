use model::document::{RenderElement, RenderNode, RenderText};
use yew::{
    function_component,
    virtual_dom::{VTag, VText},
    Html, Properties,
};

fn render_node(node: &RenderNode) -> Html {
    match node {
        RenderNode::Text(RenderText { content }) => VText::new(content.to_string()).into(),
        RenderNode::Element(RenderElement {
            tag,
            attributes,
            children,
        }) => {
            let mut tag = VTag::new(tag.as_str());

            for attribute in attributes {
                tag.add_attribute(attribute.name.as_str(), attribute.value.to_string());
            }

            for child in children {
                let child = render_node(child);
                tag.add_child(child);
            }

            tag.into()
        }
    }
}

#[derive(Properties, PartialEq)]
pub struct RenderProps {
    pub node: RenderNode,
}

#[function_component(Render)]
pub fn render(props: &RenderProps) -> Html {
    render_node(&props.node)
}
