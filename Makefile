MODE ?= debug

ifeq ($(MODE),release)
	NODE_ENV = production
	CARGO_FLAGS = --release
	TARGET_DIR = target/release
	POSTCSS_FLAGS = --no-map -env production
	RENDER_FLAGS = --minify
else
	NODE_ENV = development
	CARGO_FLAGS =
	TARGET_DIR = target/debug
	POSTCSS_FLAGS = --map --env development
	RENDER_FLAGS =
endif

# The two tools, written in Rust, that we use to render the website.
MARKDOWN = $(TARGET_DIR)/markdown
RENDER = $(TARGET_DIR)/render

RUST_SOURCES = $(shell find src -type f -name '*.rs')
TEMPLATES = $(shell find templates -type f)
CONTENT = $(shell find content -type f -name '*.md')
PAGES_HTML = $(patsubst content/%.md,output/%.html,$(CONTENT))
PAGES_JSON = $(patsubst output/%.html,build/content/%.json,$(PAGES_HTML))
TAGS = $(shell cat data/tags.yaml | yq -r '.tags | keys | .[]' | sort)
TAG_PAGES = $(patsubst %,output/tags/%/index.html,$(TAGS))

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
							 output/tags/index.html

# Pagination pages for the blog index
BLOG_PAGINATION = build/blog.pagination.stamp

.PHONY: debug release all clean

all: $(PAGES_HTML) $(ASSETS) $(JAVASCRIPT) $(STATIC) $(EXTRA_OUTPUT) $(BLOG_PAGINATION) $(TAG_PAGES)

debug:
	$(MAKE) MODE=debug all

release:
	$(MAKE) MODE=release all

build/.cargo.$(MODE): Cargo.toml $(RUST_SOURCES)
	mkdir -p $(dir $@)
	cargo build $(CARGO_FLAGS)
	pnpm install
	touch $@

$(MARKDOWN): build/.cargo.$(MODE)
$(RENDER): build/.cargo.$(MODE)

output/%.html: build/content/%.json $(PAGES_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	cat $< | $(RENDER) $(RENDER_FLAGS) -o $@ $$(./scripts/select-template.sh $< $*)

build/content/%.json: content/%.md $(MARKDOWN) $(TEMPLATES)
	mkdir -p $(dir $@)
	$(MARKDOWN) -o $@ $<

output/css/%.css: assets/css/%.css $(shell find assets/css -type f -name '*.css') postcss.config.js
	mkdir -p $(dir $@)
	NODE_ENV=$(NODE_ENV) pnpm postcss $< -o $@

ifeq ($(MODE),release)
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	pnpm terser $< -o $@
else
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	cp $< $@
endif

output/sitemap.xml: $(PAGES_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) -o $@ sitemap.xml

output/index.xml: $(PAGES_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) -o $@ rss.xml

output/blog/index.xml: $(PAGES_JSON) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{"target":"blog"}' | $(RENDER) -o $@ rss.xml

output/tags/index.html: data/tags.yaml $(CONTENT) $(RENDER) $(TEMPLATES) $(PAGES_JSON)
	mkdir -p $(dir $@)
	cat data/tags.yaml | $(RENDER) $(RENDER_FLAGS) -o $@ --yaml tags.html

output/tags/%/index.html: data/tags.yaml $(CONTENT) $(RENDER) $(TEMPLATES) $(PAGES_JSON)
	mkdir -p $(dir $@)
	echo '{"tag":"$*"}' | $(RENDER) $(RENDER_FLAGS) -o $@ --yaml tag.html

$(BLOG_PAGINATION): $(PAGES_JSON) $(RENDER) $(TEMPLATES) scripts/render-paginated.sh
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
