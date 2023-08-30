use std::sync::{Arc, Mutex};

use web_sys::HtmlHeadElement;
use yew::{
    create_portal, function_component, html, use_context, use_state, Children, Html, Properties,
};
use yew_hooks::use_effect_once;

// Remove the elements inserted by SSG.
fn remove_ssg_elements(head: &HtmlHeadElement) {
    let mut node = head.first_element_child();
    let mut removing = false;
    while let Some(child) = node {
        let next = child.next_element_sibling();

        let is_script = child.tag_name() == "SCRIPT";

        if is_script && child.id() == "head-ssg-before" {
            removing = true;
        }

        if removing {
            child.remove();
        }

        if is_script && child.id() == "head-ssg-after" {
            removing = false;
        }

        node = next
    }
}

#[derive(Properties, PartialEq)]
pub struct HeadProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Head)]
pub fn head(props: &HeadProps) -> Html {
    let head = use_state(|| None::<HtmlHeadElement>);

    if let Some(head_cxt) = use_context::<HeadContext>() {
        head_cxt.append(html! {
            <>{props.children.clone()}</>
        });
    }

    {
        let head = head.clone();
        use_effect_once(move || {
            let head_el = gloo::utils::head();

            // Remove the elements that were inserted into the <head> by the SSG.
            remove_ssg_elements(&head_el);

            // Store the <head> tag in the state.
            head.set(Some(head_el));

            || ()
        })
    }

    if let Some(head) = &*head {
        create_portal(html! { <>{props.children.clone()}</> }, head.clone().into())
    } else {
        html! {}
    }
}

#[derive(Default)]
pub struct HeadContext {
    content: Arc<Mutex<Vec<Html>>>,
}

impl PartialEq for HeadContext {
    fn eq(&self, _: &Self) -> bool {
        true
    }
}

impl Clone for HeadContext {
    fn clone(&self) -> Self {
        Self {
            content: Arc::clone(&self.content),
        }
    }
}

impl HeadContext {
    pub fn take(&self) -> Vec<Html> {
        let content = self.content.lock().unwrap();
        content.clone()
    }

    pub fn append(&self, html: Html) {
        let mut content = self.content.lock().unwrap();
        content.push(html);
    }
}

#[derive(Properties, PartialEq)]
pub struct HeadRenderProps {
    pub context: HeadContext,
}

#[function_component(HeadRender)]
pub fn head_render(props: &HeadRenderProps) -> Html {
    let content = props.context.take();

    html! {
        <>
            {content}
        </>
    }
}
