MODE ?= debug
RELOADER ?= false

ifeq ($(MODE),release)
	NODE_ENV = production
	CARGO_FLAGS = --release
	TARGET_DIR = target/release
	POSTCSS_FLAGS = --no-map -env production
	MARKDOWN_FLAGS =
	HTML_FLAGS =
	RENDER_FLAGS = --minify
else
	NODE_ENV = development
	CARGO_FLAGS =
	TARGET_DIR = target/debug
	POSTCSS_FLAGS = --map --env development
	MARKDOWN_FLAGS =
	HTML_FLAGS =
	RENDER_FLAGS =
endif

ifeq ($(RELOADER),true)
	RENDER_FLAGS += --env reloader=true
endif

# The tools, written in Rust, that we use to render the website.
HTML = $(TARGET_DIR)/html
MARKDOWN = $(TARGET_DIR)/markdown
RENDER = $(TARGET_DIR)/render
THEME_EXPORTER = $(TARGET_DIR)/theme

RUST_SOURCES = $(shell find src -type f -name '*.rs')
TEMPLATES = $(shell find templates -type f)
CONTENT = $(shell find content -type f -name '*.md')
PAGES_HTML = $(patsubst content/%.md,output/%.html,$(CONTENT))
PAGES_HTML_JSON = $(patsubst output/%.html,build/content/%.html.json,$(PAGES_HTML))

# RSS variants of the blog and weeknotes pages.
RSS_CONTENT = $(shell find content/blog content/weeknotes -type f -name '*.md')
PAGES_RSS_JSON = $(patsubst content/%.md,build/content/%.rss.json,$(RSS_CONTENT))

# Tool pages are raw HTML (not Markdown), processed with the `html` tool. Their `index.js` files
# are copied verbatim and loaded by the browser as ES modules.
TOOLS = $(shell find content/tools -type f -name '*.html')
TOOLS_HTML = $(patsubst content/tools/%.html,output/tools/%.html,$(TOOLS))
TOOLS_HTML_JSON = $(patsubst output/tools/%.html,build/content/tools/%.html.json,$(TOOLS_HTML))
TOOLS_SCRIPTS = $(patsubst content/tools/%.js,output/tools/%.js,$(shell find content/tools -type f -name '*.js'))

TAGS = $(shell cat data/tags.yaml | yq -r '.tags | keys | .[]' | sort)
TAG_PAGES = $(patsubst %,output/tags/%/index.html,$(TAGS))
THEMES = assets/css/themes/catppuccin-mocha.css \
					 assets/css/themes/catppuccin-latte.css

# Assets exclude CSS and JavaScript from the catch-all rule
ASSETS = $(patsubst assets/%,output/%,$(shell find assets -type f ! -path 'assets/css/*' ! -path 'assets/js/*'))

# JavaScript is handled by its own terser/copy rules below
JAVASCRIPT = $(patsubst assets/js/%.js,output/js/%.js,$(shell find assets/js -type f -name '*.js'))

# Static files are copied verbatim into the output
STATIC = $(patsubst static/%,output/%,$(shell find static -type f))

# Extra output files
EXTRA_OUTPUT = output/css/main.css \
							 output/sitemap.xml \
							 output/index.xml \
							 output/blog/index.xml \
							 output/tags/index.html \
							 output/404.html

# Pagination pages for the blog index
BLOG_PAGINATION = build/blog.pagination.stamp

.PHONY: debug release all clean json

all: json $(PAGES_HTML) $(TOOLS_HTML) $(TOOLS_SCRIPTS) $(ASSETS) $(JAVASCRIPT) $(STATIC) $(EXTRA_OUTPUT) $(BLOG_PAGINATION) $(TAG_PAGES)

json: $(PAGES_HTML_JSON) $(TOOLS_HTML_JSON) $(PAGES_RSS_JSON)

debug:
	$(MAKE) MODE=debug all

release:
	$(MAKE) MODE=release all

build/.cargo.$(MODE): Cargo.toml $(RUST_SOURCES)
	mkdir -p $(dir $@)
	cargo build $(CARGO_FLAGS)
	pnpm install
	touch $@

$(HTML): build/.cargo.$(MODE)
$(MARKDOWN): build/.cargo.$(MODE)
$(RENDER): build/.cargo.$(MODE)
$(THEME_EXPORTER): build/.cargo.$(MODE)

output/%.html: build/content/%.html.json $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	cat $< | $(RENDER) $(RENDER_FLAGS) -o $@ $$(./scripts/select-template.sh $< $*)

build/content/%.html.json: content/%.md $(MARKDOWN) $(TEMPLATES)
	mkdir -p $(dir $@)
	$(MARKDOWN) $(MARKDOWN_FLAGS) -o $@ $<

build/content/%.rss.json: content/%.md $(MARKDOWN) $(TEMPLATES)
	mkdir -p $(dir $@)
	$(MARKDOWN) $(MARKDOWN_FLAGS) --target rss -o $@ $<

build/content/tools/%.html.json: content/tools/%.html $(HTML) $(TEMPLATES)
	mkdir -p $(dir $@)
	$(HTML) $(HTML_FLAGS) -o $@ $<

output/css/%.css: assets/css/%.css $(shell find assets/css -type f -name '*.css') $(THEMES) postcss.config.js
	mkdir -p $(dir $@)
	NODE_ENV=$(NODE_ENV) pnpm postcss $< -o $@

assets/css/themes/catppuccin-mocha.css: $(THEME_EXPORTER)
	mkdir -p assets/css/themes
	$(THEME_EXPORTER) dark > assets/css/themes/catppuccin-mocha.css

assets/css/themes/catppuccin-latte.css: $(THEME_EXPORTER)
	$(THEME_EXPORTER) light > assets/css/themes/catppuccin-latte.css

ifeq ($(MODE),release)
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	pnpm terser $< -o $@
else
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	cp $< $@
endif

$(TOOLS_SCRIPTS): output/tools/%.js: content/tools/%.js
	mkdir -p $(dir $@)
	cp $< $@

output/sitemap.xml: $(PAGES_HTML_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) $(RENDER_FLAGS) -o $@ sitemap.xml

output/index.xml: $(PAGES_RSS_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) $(RENDER_FLAGS) -o $@ rss.xml

output/blog/index.xml: $(filter build/content/blog/%,$(PAGES_RSS_JSON)) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{"target":"blog"}' | $(RENDER) $(RENDER_FLAGS) -o $@ rss.xml

output/tags/index.html: data/tags.yaml $(CONTENT) $(RENDER) $(TEMPLATES) $(PAGES_HTML_JSON)
	mkdir -p $(dir $@)
	cat data/tags.yaml | $(RENDER) $(RENDER_FLAGS) -o $@ --yaml tags.html

output/tags/%/index.html: data/tags.yaml $(CONTENT) $(RENDER) $(TEMPLATES) $(PAGES_HTML_JSON)
	mkdir -p $(dir $@)
	echo '{"tag":"$*"}' | $(RENDER) $(RENDER_FLAGS) -o $@ --yaml tag.html

output/404.html: $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) $(RENDER_FLAGS) -o $@ 404.html

$(BLOG_PAGINATION): $(PAGES_HTML_JSON) $(RENDER) $(TEMPLATES) scripts/render-paginated.sh
	RENDER="$(RENDER)" RENDER_FLAGS="$(RENDER_FLAGS)" ./scripts/render-paginated.sh blog blog/index.html 10
	touch $@

output/%: assets/%
	mkdir -p $(dir $@)
	cp $< $@

$(STATIC): output/%: static/%
	mkdir -p $(dir $@)
	cp $< $@

clean:
	rm -rf build output
	rm -f assets/css/themes/catppuccin-mocha.css assets/css/themes/catppuccin-latte.css
