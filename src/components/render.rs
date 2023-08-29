use model::document::{RenderElement, RenderIcon, RenderNode, RenderText};
use yew::{
    function_component, html,
    virtual_dom::{VTag, VText},
    Html, Properties,
};
use yew_icons::{Icon, IconId};

fn icon_id_for_icon(icon: RenderIcon) -> IconId {
    match icon {
        RenderIcon::Bug => IconId::LucideBug,
        RenderIcon::Flame => IconId::LucideFlame,
        RenderIcon::Info => IconId::HeroiconsSolidInformationCircle,
        RenderIcon::Lightning => IconId::BootstrapLightningChargeFill,
        RenderIcon::List => IconId::LucideList,
        RenderIcon::Note => IconId::LucidePencil,
        RenderIcon::Question => IconId::HeroiconsSolidQuestionMarkCircle,
        RenderIcon::Success => IconId::LucideCheck,
        RenderIcon::Todo => IconId::LucideCheckCircle,
        RenderIcon::Warning => IconId::LucideAlertTriangle,
        RenderIcon::X => IconId::LucideX,
    }
}

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

        RenderNode::Icon(icon) => {
            html! { <Icon icon_id={icon_id_for_icon(*icon)} /> }
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
