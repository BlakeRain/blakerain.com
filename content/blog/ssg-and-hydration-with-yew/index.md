---
title: SSG and Hydration with Yew
tags:
  - rust
  - wasm
  - yew
date: 2023-08-30T18:50:17.000Z
summary: |
  In this post I go over how I rewrote this website in Rust using the Yew framework with SSG and
  hydration. I cover a number of the issues that I encountered and how I addressed them.
---

For some time now, I've been hoping to update this website to move away from using [Next.js] with
TypeScript towards something written in [Rust], ideally making use of [WebAssembly].
[At work](https://eclipse-pci.com/) we've had quite a lot of success using WebAssembly, both for
some of our web interfaces, and to provide extensibility for our device software.

This has left me quite keen to explore the opportunity to use WebAssembly, along with the [Yew]
web framework, to create a statically generated website that uses hydration to provide
interactivity. This project, whilst complete, has not been without some frustrations and issues.
I felt it might be worth documenting some of the more interesting problems I encountered along the
way.

# What is SSG and Hydration? {#what-is-ssg-and-hydration}

{{< callout type=note >}}
If you're already familiar with this topic, you might want to skip ahead to the next section.
{{</callout>}}

These days, it is fairly common for web applications to use libraries such as [React] or [Vue.js]
to power their user interface. These libraries typically offer excellent approaches to building
powerful interactive interfaces on the web. It is not uncommon for web applications to be developed
as a Single Page Application (SPA), where a single HTML page is loaded which provides the entire
application.

There are some drawbacks to using an SPA, which can include:

- It can be next to impossible for a search engine bot to crawl the content of an SPA. Typically
  search engine crawlers do not execute JavaScript, and therefore site content is often not indexed.
- As SPAs can entail large amounts of JavaScript that must be loaded by the browser prior to
  execution, there can be a noticeable delay before the site is displayed.

Static Site Generation (SSG) describes a methodology in which the HTML for each page of a site
is generated ahead of time as part of a build process, as opposed to upon each HTTP request. The
generated HTML can be served as static content, such as via a CDN. This approach is best suited for
websites where the content does not change very often.

Various frameworks exist, such as [Next.js] and [Gatsby], that help mitigate the drawbacks of SPAs
whilst maintaining the advantages of libraries such as React or Vue.js. Often these frameworks use
SSG as a mechanism to achieve this. In order to maintain the rich interactive interface afforded by
an SPA, frameworks will offer support for _hydration_: a process whereby client-side JavaScript
attaches to the existing HTML served in the initial response, rather than generating it.

# The Yew Web Framework {#the-yew-web-framework}

[Yew] is a component-based framework for [Rust] that is similar to [React], and typically compiles
to [WebAssembly]. Tools like [Trunk] can make the processes of building an SPA using Yew quite a
delightful experience.

Yew includes support for [Server-Side Rendering], which allows us to render the site on the server
in response to a request.

SSR with Yew is quite easy to work with: rather than use the [`Renderer`] to mount our application
in the `<body>` element of our page, I use the [`LocalServerRenderer`] type to render the initial
HTML of our application.

```rs
use yew::LocalServerRenderer;

async fn render_my_app() -> String {
    let renderer = LocalServerRenderer::<MyApp>::new();
    renderer.render().await
}
```

Yew also includes support for [SSR hydration], where the client-side Yew application attaches to
the HTML generated server-side. Using the `hydrate` method of the `Renderer` type will hydrate all
elements under the `<body>` element of our page.

```rs
use yew::Renderer;

fn hydrate_my_app() {
    let renderer = Renderer::<MyApp>::new();
    renderer.hydrate();
}
```

{{< callout type=note >}}
The `LocalServerRenderer` and hydration support will require the `ssr` and `hydration` features to
be enabled for the `yew` crate.
{{</callout>}}

This is very close to what I needed in order to achieve my goal of a hydrating SSG using WebAssembly:

1. I knew that I could generate some static HTML from a Yew application (SSG), and
2. Once loaded into the browser, I could attach a Yew application to that HTML (hydration).

# Preparing for Hydration {#preparing-for-hydration}

In order for the dynamic elements of the site to be available once the statically generated HTML has
been loaded by the web browser, the Yew application needs to be attached to the DOM using hydration.

In order to enable component hydration in Yew, the `hydration` feature needs to be enabled for the
`yew` crate. I also needed to make sure to call the [`Renderer::hydrate`] method rather than the
usual `render` method.

To ensure this is the case, I added a `hydration` feature to the main crate and this flag is set
when building using Trunk:

```
trunk build --release --features hydration
```

This generates the `index.html` that I use as a template in the SSG along with the WebAssembly of
the hydrating application.

## Using Phantom Components {#phantom-components}

During hydration, I needed to make sure that the elements found in the HTML generated during SSG and
loaded into the browser correspond exactly to those the hydrating application expects. This is
mostly fairly simple, but there is one good example of where it is not so easy: the use of the
`HeadContext` in the `StaticApp` component. When rendering the normal `App` used during a hydration
build I do not have access to a `HeadContext`. As such, I need to use a [`PhantomComponent`] to
tell Yew that there would have been a component of the given type in that location.

```rust
#[function_component(App)]
pub fn app() -> Html {
    html! {
        <PhantomComponent<ContextProvider<HeadContext>>>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </PhantomComponent<ContextProvider<HeadContext>>>
    }
}
```

## Rendering Markdown {#rendering-markdown}

The main purpose of this site is to render some Markdown. I have fairly particular requirements for
the HTML generated from these Markdown documents. For example, I want images to be included with
an `<img>` tag within a `<figure>`, rather than inside a `<p>`, which is what is usually generated.

Getting the rendering of Markdown took me _four attempts_ to get right, which is both frustrating
and embarrassing.

### First Attempt

My first attempt simply compiled the original Markdown documents into the WebAssembly by using the
[include_dir] crate. I was then able to parse the Markdown and render it.

Unfortunately this had the drawback of including all the code to parse Markdown and render it,
increasing the size of the WebAssembly quite a lot. Additionally, it imposed quite a fair amount of
processing on each navigation.

Once I added in support for syntax highlighting, the size of the WebAssembly increased
_dramatically_, and the rendering speed was significantly affected. The latter was more pronounced
on documents with many separate code blocks, which is pretty common on a programming blog.

### Second Attempt

To address the issues I encountered with the first attempt, I decided that it would be better to
parse the Markdown and render the HTML, including performing the syntax highlighting, during the
compilation of the application. I would then just include the generated HTML in the WebAssembly.

I did this by splitting out the representation of a document into a separate `model` crate, and then
creating a `macros` crate that would contain the macros for this process. Whilst I was at it, I
also changed the parsing of the document metadata and the tags into their corresponding structures
to use macros as well.

With these macros in place, I could include all the markdown and tags during compilation:

```rust
macros::tags!("content/tags.yaml");

mod blog {
    macros::documents!("content/blog");
}

mod pages {
    macros::documents!("content/pages");
}
```

The `tags!` macro generates a `TagId` enumeration for all the tags parsed from the YAML file. The
`TagId` enumeration implements the `Display` and `FromStr` traits that enable conversion to and from
the slug for each tag. Additionally, a `tags()` function is generated that returns a `HashMap`
mapping each slug to the corresponding `Tag` structure from the `model` crate.

The `documents!` macro is the more heavy-hitting macro: it parses all Markdown documents in a
directory. A `DocId` enumeration is generated that contains an enumerator for each document. The
enumeration implements the `Display` and `FromStr` traits that allow conversion between a `DocId`
and the document slug (essentially the file name). Because of these two traits, the `DocId` type can
be used in the `Route` type.

Two functions are also produced by the `documents!` macro: the `documents()` function that returns a
`Vec` of `model::Details` structures describing the metadata of all the Markdown documents parsed
from the directory. The second function, `render()`, takes a `DocId` and returns the rendered HTML
as a `&'static str`.

The rendered HTML for a document, retrieved as an `str` reference from the generated `render()`
function, was wrapped in a Yew [`VRaw`]. The `VRaw` type allows us to insert raw HTML into an
application.

This worked very well at first. The pages loaded very quickly, and the rendered HTML strings were
not that large. Unfortunately this quickly ran into a problem: Yew cannot hydrate a `VRaw` 🤬.

### Third Attempt

Well I was getting fairly frustrated now. It seemed that I really needed to create a full virtual
DOM for each document so that Yew could both render it during SSG and hydrate it once loaded. I
couldn't use raw HTML, as that could not be hydrated.

So, I proceeded to change the document rendering function from one that would simply return a
reference to a string, to one that would build a virtual DOM:

```rust
// pub fn render(ident: DocId) -> Option<(Details<DocId>, &'static str)> NOPE
pub fn render(ident: DocId) -> Option<(Details<DocId>, Html)>
```

The `documents!` macro was changed quite significantly to generate code using a combination of Yew's
`html!` macro and raw generation of the `VNode` values.

This approach seemed to be working well. As I handled more of the variants of the [`Event`] and [`Tag`]
enumerations that came from the Markdown parser, the size of the WebAssembly started to increase
quite dramatically. The release build was fairly hefty, however the debug build quickly ballooned to
over 20MB in size.

This started to push up against some limits in some of the tooling that I was using. For example,
I was running into a limit on the maximum [number of locals] in the `wasmparser` crate. At the time
of writing, this limit is currently set to 50,000. This is not actually an arbitrary value, this
limit can also bee seen in [Firefox] and [Chrome]. And honestly, exceeding fifty thousand locals in
a function is quite concerning.

Whilst I was still able to use the generated code when compiling with optimisations enabled, it
quickly became difficult to work with. Moreover, the size of the WebAssembly was starting to get
quite large, even in release mode.

I considered refactoring the code to try and break up the rendering functions somewhat, but that
would required finding out exactly where Rust was generating all these locals, and I really just ran
out of fucks to give by this point.

### Forth and Final Attempt

After a break, I embarked on what I hoped was my final attempt. I would rebuild the Markdown
renderer... again. This time, however, it would not generate HTML as a string, or try and generate a
`VNode`: instead it would generate a bytestring. That bytestring would contain a simplified virtual
DOM that would be serialized using the [postcard] crate. Then, on the client side, I would write a
function that maps the deserialized mini-DOM to Yew's `VNode` structure.

To start with, I defined a `RenderNode` enumeration that contained the three types of node I wanted
to render: text, HTML elements and icons images.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum RenderNode {
    Text(RenderText),
    Element(RenderElement),
    Icon(RenderIcon),
}
```

The `RenderText` type was simply a wrapper around a `String`, and the `RenderIcon` was an
enumeration of the icons that I needed during rendering of the Markdown documents. The
`RenderElement` type was a structure that encapsulated the name of the tag, any attributes, and any
children.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderElement {
    pub tag: TagName,
    pub attributes: Vec<RenderAttribute>,
    pub children: Vec<RenderNode>,
}
```

Notice that the `tag` field is the `TagName` type, which is an enumeration of all the tag names that
I need during rendering. This allows me to use `TagName::Div` or `TagName::Figure` rather than the
strings `"div"` or `"figure"`. This saves quite a lot of space, and improves performance when I need
to map a `RenderNode` to a `VNode` on the client as I'll only be comparing discriminators rather
than strings.

The `attributes` field is a simple `Vec` of a `RenderAttribute` structure. This structure pairs an
`AttributeName` with a value for that attribute in a `String`.

```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct RenderAttribute {
    pub name: AttributeName,
    pub value: String,
}
```

Just like the `TagName` enumeration, each attribute that I need is described by an `AttributeName`
enumeration, such as `AttributeName::Class` or `AttributeName::Href`.

During rendering, each `RenderNode` can be rendered to `Html` with a simple `match` statement:

```rust
fn render_node(node: &RenderNode) -> Html {
    match node {
        RenderNode::Text(RenderText { content }) =>
            VText::new(content.to_string()).into(),

        RenderNode::Element(RenderElement {
            tag,
            attributes,
            children,
        }) => {
            let mut tag = VTag::new(tag.as_str());

            for attribute in attributes {
                tag.add_attribute(
                    attribute.name.as_str(),
                    attribute.value.to_string()
                );
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
```

Notice that the `TagName` and `AttributeName` enumerations both have a `to_string()` method that
returns a `&'static str` suitable for use with the `VTag::new` and `VTag::add_attribute()` methods.
Whilst the `VTag::new()` function can take anything that implements `Into<Cow<str>>`, the
[`VTag::add_attribute()`] actually requires the attribute name to be a `&'static str`. It's almost
like planning something pays off 😌.

Examining the output from this attempt, the size of the generated byte string is never especially
large. The following table lists the sizes for three of the blog posts in this site.

| Post                                  | Markdown | Byte String | Compressed Byte String | SSG HTML |
| ------------------------------------- | -------: | ----------: | ---------------------: | -------: |
| [Moving to Mastodon]                  |      10k |         11k |                     5k |      56k |
| [Allocating memory for DMA in Linux]  |      36k |         57k |                    15k |     118k |
| [Overlays with Custom Widgets in GTK] |      35k |         72k |                    12k |     141k |

The last post in the table, [Overlays with Custom Widgets in GTK], is the largest of the generated
byte strings at 72kb. As you can see from the second-to-last column, the byte strings compress quite
well, which helps with the transmission of the produced WebAssembly.

# Static Generation {#static-generation}

To achieve the static site generation (SSG), I built a simple tool as part of the site called
[site-build]. This tool generates the static version of the site by taking the following steps:

1. Retrieve the `index.html` output by the Trunk tool and use it as a template for each generated
   HTML page. It is into this template that the tool inserts the HTML rendered by Yew's
   `LocalServerRenderer`.
1. Render each of the routes of the application.
1. Copy over all the remaining assets output by Trunk, which will include the WebAssembly and
   JavaScript glue.
1. Generate things like the `sitemap.xml`, and the Atom and RSS feeds.

## HTML Template {#html-template}

Each page that is rendered does so by injecting the output of the `yew::LocalServerRenderer` into an
HTML template; remember that Yew will expect to hydrate into the `<body>` element, so I must also
place the rendered page content in the same location.

```html
<!doctype html>
<html>
  <head>
    ...
  </head>
  <body>
    <!-- RENDER GOES HERE -->
  </body>
</html>
```

The HTML that I used as a template was the `index.html` output by Trunk. Trunk essentially
takes an `index.html` as an input, processes any asset instructions found within, and outputs those
assets along with a new `index.html`. All this is typically output into a `dist` directory.

The input `index.html` contains instructions for the processing of assets. Each instruction is given
as a `<link>` element with the `data-trunk` attribute. For example, I want to copy all the files and
directories under the `public/content` directory to the `dist` directory for deployment. To do this,
I can tell Trunk to copy the entire directory:

```html
<link data-trunk rel="copy-dir" href="public/content" />
```

The CSS for the application is compiled by [postcss] into a single CSS file. I want this CSS file to
be included in the HTML file, and Trunk can do this:

```html
<link data-trunk rel="inline" type="css" href="target/main.css" />
```

The final `index.html` is generated by running `trunk build`, which compiles all the resources into
the `dist` directory along with the `index.html`.

The `site-build` program loads the `index.html` from the `dist` directory and marks the insertion
locations for the `<body>` and `<head>` tags. These locations are used to insert rendered HTML into
both the `<head>` and `<body>` elements of each page.

## Rendering Routes {#rendering-routes}

In order to render all the routes, I first needed both a function that could take a `Route` and
render it to an HTML file and some `Iterator` over `Route`. In order to get an iterator over the
routes in the app I used the [`Sequence`] trait from the [enum-iterator] crate. I was then able to
iterator over all the routes using the [`all`] function to collect up all the routes:

```rust
struct RenderRoute {
    pub route: Route,
    pub path: PathBuf,
}

fn collect_routes() -> Vec<RenderRoute> {
    enum_iterator::all::<Route>()
        .map(|route| {
            let path = route.to_path();
            let path = if path == "/" {
                PathBuf::from("index.html")
            } else {
                PathBuf::from(&path[1..]).with_extension("html")
            };

            RenderRoute { route, path }
        })
        .collect()
}
```

The `collect_routes` function iterates over all the routes in the app and collects them into a `Vec`
of `RenderRoute`. For each route, the `RenderRoute` structure tells us:

1. The `route` to render. This is passed to the Yew application when the page needs to be rendered,
   and tells our router which page to render.
1. A `PathBuf` that contains the relative path to the output HTML file. A special case is present to
   handle the empty route, and use `index.html` instead.

The rendering of each route is performed by a `render_route` function. This function create a Yew
app for static rendering and uses the [`render_to_string`] method of the [`LocalServerRenderer`] type
to render the HTML. The contents are then injected into the HTML template and written to the file
specified in the `RenderRoute::path` field.

In order to perform the static rendering, I needed to swap out the router used by the application.
Normally, the application uses the [`BrowserRouter`] type. This uses the browser's native history to
handle the routing, and is typically the router that you want to use in an application.

However, for the static rendering there is no [`BrowserHistory`] as this code is not running in a
web browser. Conveniently, there is an in-memory history as part of the Yew router called
[`MemoryHistory`]. I used this to create a [`Router`] component as opposed to a [`BrowserRouter`].

```rust
#[derive(Properties, PartialEq)]
pub struct StaticAppProps {
    pub route: Route,
    pub head: HeadContext,
}

impl StaticAppProps {
    fn create_history(&self) -> AnyHistory {
        let path = self.route.to_path();
        let history = MemoryHistory::with_entries(vec![path]);
        history.into()
    }
}

#[function_component(StaticApp)]
pub fn static_app(props: &StaticAppProps) -> Html {
    let history = props.create_history();

    html! {
        <ContextProvider<HeadContext> context={props.head.clone()}>
            <Router history={history}>
                <AppContent />
            </Router>
        </ContextProvider<HeadContext>>
    }
}
```

{{< callout type=note >}}
Something you might have noticed here is the addition of the `HeadContext` type in the
`StaticAppProps`. This is used to capture HTML that should be written into the `<head>` element,
rather than the `<body>`. I'll get to that in the next section.
{{</callout>}}

With the `StaticApp` component prepared I was then able to render each route using the
[`LocalServerRenderer`] introduced earlier:

```rust
async fn render_route(&self, route: Route) -> String {
    // Create the `HeadContext` to capture HTML written to the <head>.
    let head = HeadContext::default();

    // Create a `LocalServerRenderer` over the `StaticApp` component.
    let render = {
        let head = head.clone();
        LocalServerRenderer::<StaticApp>::with_props(StaticAppProps { route, head })
    };

    // Render the HTML for the <body> from the `LocalServerRenderer`.
    let mut body = String::new();
    render.render_to_string(&mut body).await;

    // Create a `LocalServerRenderer` over the `HeadRender` component.
    let render =
        LocalServerRenderer::<HeadRender>::with_props(HeadRenderProps { context: head });

    // Render the HTML for the <head>.
    let mut head = String::new();
    render.render_to_string(&mut head).await;

    // Insert the HTML for the <head> and <body> elements into the template.
    self.template.render(head, body).await
}
```

The output of this function is a `String` that contains the `index.html` output from Trunk,
with the HTML generated for the given `Route` inserted. This can then be written to a file.

## Page Titles and Metadata {#page-titles-and-metadata}

For each page that I generated, I not only needed to inject HTML into the `<body>`, but also into
the `<head>`. For example, if I did not do this, each page would have the same `<title>`: that which
was originally in the `index.html` input fed to Trunk. Additional elements need to be added to
`<head>` such as [OpenGraph](https://ogp.me/) and other SEO nonsense.

In order to support writing to the `<head>` I use a `<Head>` component. This component uses a Yew
[portal] to render into the `<head>` element. The element is queried from the document using the
[`head()`] function from `gloo::utils` which returns the [`HTMLHeadElement`]. I retrieve the element
in a [`use_effect_once`] and store it in a state variable. This allows me to use `<Head>` during
static rendering with no effect: the effect will not execute until after hydration. This is
important, as the `gloo::utils::head()` function will panic if not run in a browser, and Yew cannot
hydrate a portal.

```rust
#[derive(Properties, PartialEq)]
pub struct HeadProps {
    #[prop_or_default]
    pub children: Children,
}

#[function_component(Head)]
pub fn head(props: &HeadProps) -> Html {
    let head = use_state(|| None::<HtmlHeadElement>);

    // If we have the `HeadContext`, then add our HTML to it.
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
```

This component only handles the insertion of HTML into the `<head>` during normal operation of the
application or after hydration. I need to insert elements directly into the `<head>` tag when
performing static rendering. To enable this, I added a `HeadContext` that contains a `Vec<Html>`.
When I use the `<Head>` component and the `HeadContext` is available, a copy of the HTML that would
be inserted into the `<head>` is also added to the `HeadContext`.

{{< callout type=tip title="Definition of HeadContext" >}}
Currently the `HeadContext` type just wraps an `Rc<RefCell<Vec<Html>>>`. It provides a function to
add an `Html` to the `Vec`, and another function to clone the `Vec<Html>` out of the `HeadContext`.
The use of `Rc<RefCell<...>>` is fine in this case, as I'm using the `LocalServerRenderer`. However,
the `ServerRenderer::with_props()` constructor requires that the property type is `Send`, which is
not true for `HeadContext`.
If you want to use the `ServerRenderer` type instead of `LocalServerRenderer`, you will probably
want to change the `HeadContext` type to somethine like an `Arc<Mutex<...>>` rather than an
`Rc<RefCell<...>>`.
{{</callout>}}

When it comes to rendering the application, I provide the `HeadContext` value in the `StaticApp`
component, and capture any `Html` stored in it. After rendering the contents of the `<body>` a new
`LocalServerRenderer` is created for the `HeadRender` component. This component simply renders the
content of the `HeadContext`. This renderer is then used to render the contents of `<head>`. After
rendering, the HTML is inserted into the `<head>` between two `<script>` tags:

```html
<head>
  ...
  <script id="head-ssg-before"></script>
  <!-- Generated HTML goes here -->
  <script id="head-ssg-after"></script>
  ...
</head>
```

This allows me to write code to inject HTML into the `<head>` that will work with both the normal
operation of the site, during static generation, and when hydrating.

Unfortunately, there is a small problem with this approach to inserting elements in to the `<head>`:
Yew cannot hydrate portals.

As I cannot hydrate a [`VPortal`], the portal that I use in the `Head` component will not be
attached to the elements added to the `<head>` during SSG. The result of this is that, when visitors
navigate using the [`BrowserRouter`], those SSG elements will linger, and our new `<head>` elements
will be overshadowed or ignored. This can lead to some confusion.

To deal with this, I added some code that will remove all SSG generated elements in the `<head>`
when the component mounts. When the application hydrates and the `use_effect_once` is executed, the
elements added by the SSG are removed and a reference to the `<head>` is stored in the state. When
the state changes, this causes a re-render of the `<Head>` component, which will create the portal
that adds the components back into the `<head>`, only this time they are controlled by Yew and can
be changed.

The site removes the elements that were added during SSG by simply removing all elements in the
`<head>` tag between the `<script>` tags with the IDs `head-ssg-before` and `head-ssg-after`. I also
remove these marker `<script>` tags as well.

## Copying and Generating Resources {#copying-and-generating-resources}

The remaining tasks for the `site-build` program to complete are as follows:

1. Copy all the resources output by Trunk into the `dist` directory to the `out` directory, and
2. Generate the remaining resources.

The copying of resources is simply a matter of copying everything that the Trunk tool wrote to
the `dist` directory into the `out` directory. This includes the WebAssembly compiled with the
`hydration` feature and the JavaScript glue generated by [`wasm-bindgen`]. The `site-build` tool is
careful to skip the `index.html` file that was used as a template. If it did not, it would overwrite
the file with the same name that was generated during SSG for the `Route::Home` route.

Finally, the tool needs to generate a few resources:

1. The `sitemap.xml` file,
1. The RSS feed (found under [`/feeds/feed.xml`](/feeds/feed.xml)), and
1. The Atom feed (found under [`/feeds/atom.xml`](/feeds/atom.xml)).

The first file is generated by simply building a `String` containing the XML. The last two are
generated by populating the structures from the [rss] and [atom_syndication] crates and then writing
their generated XML to the corresponding files.

# Conclusion

With the site written and prepared for hydration, the markdown parsed and semi-rendered during
compilation, and the `site-build` tool complete and working... I was finally able to get to the
point where the site was being statically generated and any dynamic elements were being provided by
WebAssembly.

At the time of writing this conclusion, the WebAssembly that will be transmitted to the browser is
816 Kb. The Next.js site included a total of 997 kB of JavaScript.

Loading just the home page loads 1.11 MB (465.27 kB transferred). The Next.js version of this site
loaded 1.42 MB (545.68 kB transferred).

For all intents and purposes I'd call the sites the same size. When I first started using
WebAssembly, I was quite surprised at results like this. For a long time I had been under the
impression that WebAssembly typically required very large files.

It is very difficult to profile this site: it does very little other than rendering some HTML. There
are some places where the WebAssembly is noticeably faster than the Next.js version of the site due
to features that are no longer present. For example, the previous version of the site included a
search system that could highlight tokens within a document when rendering it. This added some
overhead to the page generation that is not present in the WebAssembly version.

I think that WebAssembly and the Rust web frameworks have evolved to a point where they are a
suitable replacement for the likes of React for most of my use cases, both personal and
professional. There are some larger applications that I would need to think about before attempting
to implement as I have with this one and others, mostly notably around the volume of content and the
complexity of the components.

In terms of this site, I think I will keep it as it is and work on some more content. I have a few
other posts in the works that I need to finish off.

[Next.js]: https://nextjs.org/
[Rust]: https://www.rust-lang.org/
[WebAssembly]: https://webassembly.org/
[Yew]: https://yew.rs/
[React]: https://react.dev/
[Vue.js]: https://vuejs.org/
[Gatsby]: https://www.gatsbyjs.com/
[Trunk]: https://trunkrs.dev/
[Server-Side Rendering]: https://yew.rs/docs/next/advanced-topics/server-side-rendering
[SSR hydration]: https://yew.rs/docs/next/advanced-topics/server-side-rendering#ssr-hydration
[`Renderer`]: https://docs.rs/yew/0.20.0/yew/struct.Renderer.html
[`ServerRenderer`]: https://docs.rs/yew/0.20.0/yew/struct.ServerRenderer.html
[`LocalServerRenderer`]: https://docs.rs/yew/0.20.0/yew/struct.LocalServerRenderer.html
[site-build]: https://github.com/BlakeRain/blakerain.com/blob/main/src/bin/site-build.rs
[postcss]: https://postcss.org/
[enum-iterator]: https://docs.rs/enum-iterator/1.4.1/enum_iterator/trait.Sequence.html
[`Sequence`]: https://docs.rs/enum-iterator/latest/enum_iterator/trait.Sequence.html
[`all`]: https://docs.rs/enum-iterator/1.4.1/enum_iterator/fn.all.html
[`Router`]: https://docs.rs/yew-router/0.17.0/yew_router/router/struct.Router.html
[`render_to_string`]: https://docs.rs/yew/0.20.0/yew/struct.ServerRenderer.html#method.render_to_string
[`BrowserRouter`]: https://docs.rs/yew-router/0.17.0/yew_router/router/struct.BrowserRouter.html
[`BrowserHistory`]: https://docs.rs/gloo/0.10.0/gloo/history/struct.BrowserHistory.html
[`MemoryHistory`]: https://docs.rs/yew-router/0.17.0/yew_router/history/struct.MemoryHistory.html
[portal]: https://yew.rs/docs/advanced-topics/portals
[`head()`]: https://docs.rs/gloo/0.10.0/gloo/utils/fn.head.html
[`HTMLHeadElement`]: https://docs.rs/web-sys/0.3.64/web_sys/struct.HtmlHeadElement.html
[`use_effect_once`]: https://docs.rs/yew-hooks/0.2.0/yew_hooks/fn.use_effect_once.html
[`VPortal`]: https://docs.rs/yew/0.20.0/yew/virtual_dom/struct.VPortal.html
[`Renderer::hydrate`]: https://docs.rs/yew/0.20.0/yew/struct.Renderer.html#method.hydrate
[`PhantomComponent`]: https://docs.rs/yew/0.20.0/yew/html/struct.PhantomComponent.html
[include_dir]: https://docs.rs/include_dir/0.7.3/include_dir/index.html
[`VRaw`]: https://docs.rs/yew/0.20.0/yew/virtual_dom/struct.VRaw.html
[`Event`]: https://docs.rs/pulldown-cmark/0.9.3/pulldown_cmark/enum.Event.html
[`Tag`]: https://docs.rs/pulldown-cmark/0.9.3/pulldown_cmark/enum.Tag.html
[number of locals]: https://github.com/bytecodealliance/wasm-tools/blob/03d21b8d9f0dd29441c5de4d6a2fc1505a9fd0d5/crates/wasmparser/src/validator/operators.rs#L3425C10-L3425C10
[Firefox]: https://github.com/mozilla/gecko-dev/blob/132ffbfd6842e5ecd3813673c24da849d3c9acf8/js/src/wasm/WasmConstants.h#L1097
[Chrome]: https://github.com/v8/v8/blob/3c8f523f939680fb5f8ba48ee6dc80adfb22fe83/src/wasm/wasm-limits.h#L51
[postcard]: https://docs.rs/postcard/1.0.6/postcard/index.html
[`VTag::add_attribute()`]: https://docs.rs/yew/0.20.0/yew/virtual_dom/struct.VTag.html#method.add_attribute
[Allocating Memory for DMA in Linux]: /blog/allocating-memory-for-dma-in-linux
[Moving to Mastodon]: /blog/moving-to-mastodon
[Overlays with Custom Widgets in GTK]: /blog/overlays-with-custom-widgets-in-gtk
[`wasm-bindgen`]: https://docs.rs/wasm-bindgen/latest/wasm_bindgen/
[rss]: https://docs.rs/rss/2.0.6/rss/index.html
[atom_syndication]: https://docs.rs/atom_syndication/0.12.2/atom_syndication/
