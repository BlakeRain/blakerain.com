---
title: A New Website Builder
date: 2026-08-30T16:25:00
tags:
  - meta
  - rust
coverImage:
  author: Steffen Lemmerzahl
  url: https://unsplash.com/photos/a-room-that-has-a-bunch-of-items-in-it-yJpvGn5goGc
---

For a while now, I've been reading various blog posts from people that have been iterating on their
websites, changing tools, and experimenting with different approaches to hosting or generating their
content. As a great example, I've had fun this year reading [Jack Baty's] posts about switching
between [Hugo], Kev Quirk's [Pure Blog], and [Ghost]. Jack has some more posts in the [blogging
tag] on [baty.net]. His post on [Blog management fatigue] was a bit hard to relate to, given that I almost
never post anything, but it's interesting to see how other people approach their own blogging
process.

{% from "macros/quote.html" import quote %}
{% call quote("Jack Baty", url="https://baty.net/posts/2026/02/blog-management-fatigue/") %}
Sometimes I just want a CMS.
{% endcall %}

Ew 😂

I also recently read an article or blog post that argued something to the effect that your website
is never finished, and that you should keep evolving it and trying different things. Typically, I
haven't saved this anywhere, or I can't find it if I have.

<!--more-->

[Jack Baty's]: https://baty.blog/tag/blogging
[Pure Blog]: https://pureblog.org/
[Ghost]: https://ghost.org/
[blogging tag]: https://baty.net/tags/blogging/
[baty.net]: https://baty.net/
[Blog management fatigue]: https://baty.net/posts/2026/02/blog-management-fatigue/

# I'm Tired of Hugo

Just to be clear: I really like [Hugo], and I've built several other static sites using Hugo and
been very happy with it. It's actually a great generator, and makes a lot of things very easy.
However, for this site I've been running into a bit of friction, primarily in two areas:

1. I have to use Go templates for the website, and I don't really like working with them.
2. I can't add any additional processing to the site, such as different figure generation.

The latter is a problem that appears to be fundamental to Hugo. I often see references to an issue
that was [opened in 2020] about adding support for generating figures and diagrams. Most of the
solutions offered were client-side solutions like [mermaid], which relies on code execution in the
client. This is less idea for environments where there is no JavaScript, like RSS readers,
read-it-later apps like [Readeck], and anybody that runs with JavaScript disabled. It also greatly
increases the amount of data being transmitted: mermaid itself is over a megabyte of JavaScript.

It seems that the Hugo developers are reticent to add support for external processing or plugins due
to security concerns. Whilst I'd be inclined to suggest a "_safe mode_" that can be disabled by
people who are happy to manage the risks, I can respect the developer's decision to focus on
security.

I've been wanting to start a new website renderer for a while now. I've made a few aborted attempts
at creating a new generator over the past year or so, and quickly run out of steam: a site generator
needs to do quite a bit more than just transform Markdown into HTML.

[Hugo]: https://gohugo.io/
[opened in 2020]: https://github.com/gohugoio/hugo/issues/7765
[mermaid]: https://mermaid.ai/open-source/intro/index.html
[Readeck]: https://readeck.org/en/

# New Site Generator

Now that I've got [quite a bit of spare time], I've taken the opportunity to add a further seventeen
thousand lines of code to the website (only half of them are actually mine). True to form, I've
vastly increased the size, complexity, and overall fragility of the entire site just to get back to
exactly where I started from. Great use of my time 🙄

I've decided to build the new site generator around the [minijinja] templating engine for Rust, using
a couple of small tools:

1. The `markdown` tool that renders Markdown into HTML, and captures various metadata and salient
   facts about the content, such as tags and reading time.
2. The `render` tool that takes some structured input (like JSON or YAML) along with a Jinja
   template, and renders that template with the structured input as the context.

I've also taken this as an opportunity to add support for [pikchr] diagrams, which I've been wanting
to be able to use for a while now. I'm quite excited about this part, so I'll talk more about them
later.

The two Rust tools are the `markdown` and `render` binaries: one that renders Markdown into HTML and
encapsulates extracted metadata in JSON, and the other that takes some structure input and renders a
template. The rendering of a single page, therefore, is a process of first passing the Markdown
through the `markdown` tool, collecting the output in a JSON file, and then passing that JSON file
to the `render` tool with the corresponding template. For example, to render [this blog post], we
can imagine the following commands being run:

```sh
# Render the Markdown and capture the metadata into a JSON file
markdown -o build/content/blog/a-new-website-builder/index.json \
  content/blog/a-new-website-builder/index.md

# Render the 'blog/page.html` template using the JSON file as the context
cat build/content/blog/a-new-website-builder/index.json | \
  render blog/page.html \
  > output/blog/a-new-website-builder/index.html
```

Each page is processed in much the same way: rendered from Markdown and stored in a JSON file in the
`build` directory, then rendered using a template and written to the `output` directory. Some of the
aggregation pages --- like the blog index and tags pages --- are rendered using a template that
loads all the JSON files from a directory (such as `build/content/blog` for all the blog posts), and
then processes them within the template.

```pikchr
boxwid = 3cm
boxht  = 1cm

box "blog/a/page.md"
arrow "markdown" above monospace right 2cm
JSON: box "blog/a/page.json"
RENDER: arrow "render" below monospace right 2cm
box "blog/a/page.html"
arrow <- up 1cm from RENDER.n
box "templates/a/page.html" wid 4cm
arrow down 1cm from JSON.s \
  then right until even with RENDER.e
box "blog/index.html"
"render" monospace above at last arrow.s + (0.75cm, 0)
arrow <- down 1cm from last arrow.s + (0.75cm, 0)
box "templates/blog/index.html" wid 4cm
```

If we take a look at `index.json` file that was generated by the `markdown` tool, we can see the
data that was extracted during the rendering of the Markdown:

```json
{
  "path": "blog/a-new-website-builder/index.md",
  "base": "blog/a-new-website-builder",
  "name": "index",
  "metadata": {
    "size": 9783,
    "modified": [ 2026, 242, 15, 26, 50, 80826787, 0, 0, 0 ],
    "created": [ 2026, 242, 15, 26, 50, 80177499, 0, 0, 0 ]
  },
  "frontmatter": {
    "coverImage": {
      "author": "Steffen Lemmerzahl",
      "url": "https://unsplash.com/photos/a-room-that-has-a-bunch-of-items-in-it-yJpvGn5goGc"
    },
    "date": "2026-08-30T16:25:00",
    "numberedHeadings": true,
    "tags": [
      "meta",
      "rust"
    ],
    "title": "A New Website Builder"
  },
  "summary": "<p>For a while now, ... SNIP",
  "summary_text": "For a while now, ... SNIP",
  "toc": [
    {
      "id": "im-tired-of-hugo",
      "title": "I’m Tired of Hugo",
      "children": []
    },

    ...
  ],
  "content": "<p>For a while now, ... SNIP",
  "word_count": 6666,
  "reading_time": 123
}
```

The following table goes into a bit more detail about each field in the JSON file:

| Field          | Description                                                        |
| -------------- | ------------------------------------------------------------------ |
| `path`         | The path to the Markdown file                                      |
| `base`         | The base path to the Markdown file                                 |
| `name`         | The name of the Markdown file                                      |
| `metadata`     | File information from [stat(2)]                                    |
| `frontmatter`  | The parsed frontmatter                                             |
| `summary`      | The first paragraph of the rendered content                        |
| `summary_text` | The first paragraph of the rendered content, without any HTML tags |
| `toc`          | The table of contents, built from the headings                     |
| `content`      | The full rendered Markdown document                                |
| `word_count`   | The number of words in the rendered content                        |
| `reading_time` | The estimated reading time in minutes                              |

The new site generation is driven by a [Makefile], whose job is mostly to gather up the Markdown
files from the `content` directory, and then generate the output HTML files by way of the JSON
intermediate files. Essentially, this can be boiled down to the following:

```makefile
# Get all the Markdown files in the 'content' directory
MARKDOWN_FILES = $(shell find content -type f -name '*.md')

# Map the Markdown files to their corresponding JSON files in the 'build' directory
JSON_FILES = $(patsubst content/%.md,build/content/%.json,$(MARKDOWN_FILES))

# Map the JSON files to their corresponding HTML files in the 'output' directory
HTML_FILES = $(patsubst build/content/%.json,output/%.html,$(JSON_FILES))

# Define a rule to generate the JSON files from the Markdown files
build/content/%.json: content/%.md
  markdown -o $@ $<

# Define a rule to generate the HTML files from the JSON files
output/%.html: build/content/%.json
  cat $< | render page.html > $@
```

Things get a little bit more complicated from here onwards. First of all, we want to use different
templates for different pages. The quickest way to do this was to use a simple script:
`scripts/select-template.sh`. This script basically takes the path to the JSON file, examines it,
and then picks the corresponding template. If the script finds that the `template` property is set
in the frontmatter, the value of that property is used as the template file. This let's me directly
override the template file in the Markdown document:

```markdown
---
title: My Special Page
template: special/page.html
---

This will render with the `templates/special/page.html` template.
```

If there is no `template` frontmatter, the script tries to find a template based on the directory in
which we find the Markdown file. For example, a Markdown file in `content/foo/bar/index.md` will
cause the script to check for the following templates:

- `templates/foo/bar/page.html`
- `templates/foo/page.html`
- `templates/page.html`

If none of these exist, the script will fall back to `templates/page.html`.

Further rules are defined in the `Makefile` for handling other special cases, such as:

- Generating the pages for each of the tags in the `data/tags.yaml` file, and the page that lists
  all the tags and the number of posts under each.
- Generating the RSS feed from the `blog` and `weeknotes` directories, and separately for just the
  `blog` directory. This requires collecting up all the corresponding JSON files in the `build`
  directory, and then rendering them with the `rss.xml` template.
- Rendering the `tools` directory, which uses an `html` tool to generate the page JSON file, rather
  than the `markdown` tool. This is because the files in the `tools` directory are already HTML
  files, but they have a frontmatter that needs parsing.
- Generating the `sitemap.xml` file.
- Copying over static files from the `static` directory.
- Compiling the CSS files and generating the [Catppuccin] theme files.

Taking this approach has a few advantages that get me towards a satisfactory build pipeline that is
not much less convenient than Hugos:

1. I get something that's a bit like incremental builds: I can run `make` and only the files that
   have changed will be built. Of course, Hugo did this too, so this is only really feature parity.
2. I can use `make -j` to build the site in parallel, which greatly speeds up the build process.
   I've no idea if Hugo built anything concurrently, but I'm guessing it did.
3. I can now have any kind of build pipeline I want, and I don't have to end up running into
   limitations in Hugo.

The incremental builds are _almost_ working quite well: when I make changes to a single Markdown
file, only a couple of pages are rebuilt: the blog page itself and the blog index page.
Unfortunately, this also cascades to the RSS feed, every tag page, the sitemap, and so on.

I think I'll add a new build mode that skips RSS and sitemap generation, and focuses only on the
files loaded by the browser.

In order to make life a little easier, I've added a little development server to the project. This
server will serve the files generated by the `Makefile` in the `output` directory. It also watches
various directories for changes and, if it detects any, causes the site to be rebuilt using the
`Makefile`. The development server reads various settings (such as the directories to watch) from a
`dev.json` configuration file.

Whilst this worked very nicely, there were a couple of caveats to this approach that I had to take
care of:

1. Editors like `vim` tend to do a few more operations than just writing directly to a file. This is
   a well-known behaviour, and the solution is to debounce the file detection. To do this, I've used
   the [`notify-debouncer-full`] crate, which tidies up the events received from the [`notify`]
   crate in various ways. A configuration option `debounce_ms` allows me to set the debounce time.
2. The issue with [pnpm] asking about whether it should replace the `node_modules/` directory and
   promptly blocking all operation ([#7727]) requires adding the `--yes` flag to the `pnpm install`
   command. Whilst this was obvious on Linux, when working on MacOS it appeared that the build
   process would hang with no indication of why.
3. I can't make `async` calls within the [`DebounceEventHandler`], so I used a [`broadcast`] channel
   from `tokio` to send a message to a separate task which would then invoke `make` and pipe the
   output streams to the logs.
4. Dealing with [SSE] in [poem] (my preferred web framework) was a bit of a hassle, so I used a
   [WebSocket] instead. When the server has finished a build, it sends a refresh message to a
   `broadcast`. When running under the development server, a small JavaScript module is included by
   the page template that connects to the WebSocket endpoint. When a client connects, it is
   subscribed to the refresh broadcast. When the JavaScript code receives a refresh message it calls
   `window.reload()` to reload the page, hopefully showing the latest changes.

[quite a bit of spare time]: /weeknotes/2026-W32/#-unemployment
[Makefile]: https://git.blakerain.com/BlakeRain/blakerain.com/src/commit/9c4ab7831f95ef4901c1c3e71aec105813637daa/Makefile
[this blog post]: https://git.blakerain.com/BlakeRain/blakerain.com/src/branch/main/content/blog/a-new-website-builder/index.md
[stat(2)]: https://www.man7.org/linux/man-pages/man2/stat.2.html
[Catppuccin]: https://catppuccin.com/
[`notify-debouncer-full`]: https://crates.io/crates/notify-debouncer-full
[`notify`]: https://crates.io/crates/notify
[pnpm]: https://pnpm.io/
[#7727]: https://github.com/pnpm/pnpm/issues/7727
[`DebounceEventHandler`]: https://docs.rs/notify-debouncer-full/latest/notify_debouncer_full/trait.DebounceEventHandler.html
[`broadcast`]: https://docs.rs/tokio/latest/tokio/sync/broadcast/index.html
[SSE]: https://en.wikipedia.org/wiki/Server-sent_events
[poem]: https://crates.io/crates/poem
[WebSocket]: https://docs.rs/poem/3.1.12/poem/web/websocket/index.html

# Jinja-like Templating with `minijinja`

As I've mentioned before,  I really don't like the [Go templates] that I had to use with Hugo. I
find the syntax clunky to work with, as I've been spoiled for years by the [Jinja] templating
language. For most of the projects that I've built, I use the [minijinja] crate, which provides a
Rust-based templating engine based on Jinja version 2, and is [very well documented]. It's really a
great implementation, and provides a lot of very useful features.

Using `minijinja` lets me define the templates for this website in a manner much more akin to what I
have been used to for quite some years:

```jinja
{{'{'}}% macro figure(src, class=none, href=none, target=none,
                      rel=none, enlarge=false, caption=none,
                      alt=none, width=none, height=none) %}
<figure{{'{'}}% if class is string %} class="{{'{'}}{{'{'}} class }}"{{'{'}}% endif %}>
{{'{'}}% if href %}
<a href="{{'{'}}{{'{'}} href }}"
  {{'{'}}%- if target %} target="{{'{'}}{{'{'}} target }}"{{'{'}}% endif %}
  {{'{'}}%- if rel %} rel="{{'{'}}{{'{'}} rel }}"{{'{'}}% endif %}>
{{'{'}}% elif enlarge %}
  {{'{'}}%- set full = image(src, "q75") %}
  <a href="{{'{'}}{{'{'}} full.path }}" target="_blank" rel="noopener noreferrer">
{{'{'}}% endif %}
{{'{'}}%- set spec = "q75" %}
{{'{'}}%- if width is number and height is number %}
{{'{'}}%-   set spec = spec ~ " w" ~ width ~ " h" ~ height %}
{{'{'}}%- elif width is number %}
{{'{'}}%-   set spec = spec ~ " w" ~ width %}
{{'{'}}%- elif height is number %}
{{'{'}}%-   set spec = spec ~ " h" ~ height %}
{{'{'}}%- endif %}
{{'{'}}%- set img = image(src, spec) %}
<img src="{{'{'}}{{'{'}} img.path }}"
  {{'{'}}%- if alt %} alt="{{'{'}}{{'{'}} alt }}"
  {{'{'}}%- elif caption %} alt="{{'{'}}{{'{'}} caption }}"{{'{'}}% endif %}
  {{'{'}}%- if width is number %} width="{{'{'}}{{'{'}} width }}"{{'{'}}% endif %}
  {{'{'}}%- if height is number %} height="{{'{'}}{{'{'}} height }}"{{'{'}}% endif %}>
{{'{'}}%- if href or enlarge %}</a>{{'{'}}% endif %}
{{'{'}}%- if caption %}
<figcaption>
  <p>{{'{'}}{{'{'}} caption }}</p>
  {{'{'}}%- if enlarge %}
    <div class="italic">(click image to enlarge)</div>
  {{'{'}}%- endif %}
</figcaption>
{{'{'}}%- endif %}
</figure>
{{'{'}}% endmacro %}
```

The above template is from the [`figure.html`] macro that renders a figure with an image and various
options.

[Go templates]: https://pkg.go.dev/text/template
[Jinja]: https://jinja.palletsprojects.com/en/stable/
[minijinja]: https://crates.io/crates/minijinja
[very well documented]: https://docs.rs/minijinja/latest/minijinja/
[`figure.html`]: https://git.blakerain.com/BlakeRain/blakerain.com/src/commit/0cc9e48b58af8ae70fe08d121d4cadefcbe97245/templates/macros/figure.html

# Better Diagrams with `pikchr`

Whilst the additional 17k lines seems excessive, just over half of those new lines is the C source
for [pikchr], which I've been very keen to start using for some diagrams. When I started using
UNIX about a thousand years ago, I was quite captivated with the Documentors WorkBench: the
`troff`, `grap`, `eqn`, and `pic` tools that can be combined to produce quite complex and
beautifully typeset documents.

If you've not used `pic` before, I highly encourage you to check it out. It lets you build diagrams
with a simple language. One of the main attractions of `pic` is that diagrams are laid out
automatically: objects in a diagram can be either stacked in a particular direction, or placed
relative to each other.

You can read a lot more about `pic` in [Brian Kernighan's Paper](/downloads/pic.pdf) and in the more
recent [Making Pictures with GNU PIC](/downloads/gpic.pdf) by Eric S. Raymond. The [pikchr
documentation] is also a useful resource for the differences between `pic` and `pikchr`.

I've used `pic` _a lot_ over my career as a software engineer. Many of the documents I've produced
were typeset with `troff`, and almost all diagrams were drawn with `pic`. For example, in the
documentation for the Eclipse device (a PCI-DSS descoping solution I built a few years ago), there
was a large one-page diagram of the device architecture. Here's a partial taken from the top-right
of that diagram.

```pikchr {title="Partial Diagram taken from the Eclipse Device Architecture"}
boxwid = 2cm
boxht  = 1cm

B1: box "WebSocket" "Sink"
move right 1cm
B2: box "WebSocket" "Stream"

BO: box dotted with nw at B1.nw + (-0.5cm, 0.5cm) width 6cm ht 2cm
"Reconnect" above at last.s

B3: box "CMI::Client" monospace thick thick with n at B1.s - (0,0.5)
arrow from B3.n to B1.s
arrow right 1cm from B3.e "mpsc" above
B4: box "Receiver"
arrow from B2.s to B4.n
B5: box wid 2.5cm "event_forwarder" monospace with e at B3.w - (1cm, 0)
arrow from B5.e to B3.w

arrow from BO.w \
  left until even with B5 \
  then to B5.n
"mpsc" above at last.n

arrow from B3.s \
  down 1cm \
  then left until even with B5 \
  then to B5.s
"stop" above at last.s

arrow from B3.s \
  down 1cm \
  then right until even with B4 \
  then to B4.s
"stop" above at last.s

arrow right 2cm from B4.e
B6: box "session::Manager" monospace thick thick wid 2.5cm
"Commands" "Session" above at last arrow

arrow from B6.s \
  down 0.5cm \
  then right 1cm \
  then down 0.5cm
box "session::Session" monospace width 2.5cm

arrow <-> from last box.n + (0.5cm, 0) up 2.5cm

B7: box "gateway::Manager" monospace thick thick wid 2.5cm with s at last.n - (0.5cm, 0)
arrow <-> from last box.n up 1cm
B8: box "Gateway WASM" wid 2.5cm

B9: box dashed "wasmtime" wid 1.5cm ht 0.5cm with e at last arrow.c - (1cm, 0)

arrow from B7.w left until even with B9 then to B9.s
arrow from B9.n up until even with B8 then to B8.w
```

{% from "macros/callout.html" import callout %}
{% call callout("tip") %}
You can see the source for the diagram above here: [https://paste.blakerain.com/airmictive](https://paste.blakerain.com/airmictive)
{% endcall %}

[pikchr]: https://pikchr.org/
[pikchr documentation]: https://pikchr.org/home/doc/trunk/doc/userman.md

# What's Next

I'm still settling into the new build pipeline. There are a few rough edges I'd like to smooth out
before I consider this migration complete:

- The incremental builds under the development server need refining so that changing a single page
  doesn't cascade into rebuilding the RSS feed and sitemap.
- It's difficult to actually quote Jinja code directly in Markdown files now that they're being
  rendered as templates by the `markdown` tool. I could look at adding configuration in the
  frontmatter that changes the [`SyntaxConfig`] to use different delimiters.

Beyond that, I'm looking forward to using Jinja templates when I make changes to this site, and
making better use of `pikchr` diagrams in future posts. I've missed having a proper diagramming tool
integrated into the build pipeline, and I think it'll make technical write-ups considerably clearer.

[`SyntaxConfig`]: https://docs.rs/minijinja/latest/minijinja/syntax/struct.SyntaxConfig.html
