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

# Tools used to build the site
MARKDOWN = $(TARGET_DIR)/markdown
RENDER = $(TARGET_DIR)/render

RUST_SOURCES = $(shell find src -type f -name '*.rs')
TEMPLATES = $(shell find templates -type f)
CONTENT = $(shell find content -type f -name '*.md')
PAGES = $(patsubst content/%.md,output/%.html,$(CONTENT))
PAGES_JSON = $(patsubst output/%.html,build/content/%.json,$(PAGES))

# Assets: exclude CSS and JavaScript from the catch-all rule
ASSETS = $(patsubst assets/%,output/%,$(shell find assets -type f \
				 ! -path 'assets/css/*' \
				 ))

# Extra output files
EXTRA_OUTPUT = output/css/main.css \
							 output/sitemap.xml \
							 output/index.xml \
							 output/blog/index.xml \
							 output/notes/index.xml \
							 output/tags/index.html

.PHONY: debug release all clean

debug:
	$(MAKE) MODE=debug all

release:
	$(MAKE) MODE=release all

all: $(PAGES) $(ASSETS) $(JAVASCRIPT) $(EXTRA_OUTPUT)

build/.cargo.$(MODE): Cargo.toml $(RUST_SOURCES)
	mkdir -p $(dir $@)
	cargo build $(CARGO_FLAGS)
	touch $@

$(MARKDOWN): build/.cargo.$(MODE)
$(RENDER): build/.cargo.$(MODE)

output/%.html: build/content/%.json $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	cat $< | $(RENDER) $(RENDER_FLAGS) -o $@ $$(./scripts/select-template.sh $< $*)

build/content/%.json: content/%.md $(MARKDOWN) $(TEMPLATES)
	mkdir -p $(dir $@)
	$(MARKDOWN) -o $@ $<

output/css/%.css: assets/css/%.css $(shell find assets/css -type f -name '*.css')
	mkdir -p $(dir $@)
	NODE_ENV=$(NODE_ENV) npx postcss $(POSTCSS_FLAGS) $< -o $@

ifeq ($(MODE),release)
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	npx terser $< -o $@
else
output/js/%.js: assets/js/%.js
	mkdir -p $(dir $@)
	cp $< $@
endif

output/sitemap.xml: $(CONTENT) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo "{}" | $(RENDER) -o $@ sitemap.xml

output/index.xml: $(CONTENT) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{}' | $(RENDER) -o $@ rss.xml

output/blog/index.xml: $(CONTENT) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{"target":"blog"}' | $(RENDER) -o $@ rss.xml

output/notes/index.xml: $(CONTENT) $(RENDER) $(TEMPLATES)
	mkdir -p $(dir $@)
	echo '{"target":"notes"}' | $(RENDER) -o $@ rss.xml

output/index.html: $(RENDER) $(TEMPLATES) $(PAGES_JSON)
	mkdir -p $(dir $@)
	echo "{}" | $(RENDER) $(RENDER_FLAGS) -o $@ home.html

output/tags/index.html: data/tags.yaml $(CONTENT) $(RENDER) $(TEMPLATES) $(PAGES_JSON)
	mkdir -p $(dir $@)
	cat data/tags.yaml | $(RENDER) $(RENDER_FLAGS) -o $@ --yaml tags.html

output/%: assets/%
	mkdir -p $(dir $@)
	cp $< $@

clean:
	rm -rf output
	rm -rf build
