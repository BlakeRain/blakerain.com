#!/usr/bin/env bash
set -euo pipefail

# Render the pagination pages for a section's index. Usage:
#
#   render-paginated.sh <section> <template> <default-page-size>
#
# The page size can be overridden per-section via the `paginate` key in the section index's
# front-matter (e.g. `paginate: 10` in `content/blog/index.md`).

# Make sure that we have the `jq` command available.
if ! command -v jq >/dev/null; then
  echo "error: the 'jq' command is required to run this script" >&2
  exit 1
fi

SECTION="$1"
TEMPLATE="$2"
DEFAULT_SIZE="${3:-10}"

INDEX_JSON="build/content/${SECTION}/index.json"
if [ ! -f "$INDEX_JSON" ]; then
  echo "error: no index JSON at ${INDEX_JSON}" >&2
  exit 1
fi

# Resolve the page size: front-matter overrides the default.
PAGE_SIZE=$(jq -r '.frontmatter.paginate // empty' "$INDEX_JSON" 2>/dev/null)
if [ -z "$PAGE_SIZE" ]; then
  PAGE_SIZE="$DEFAULT_SIZE"
fi

# Count the section's pages (each lives in its own directory, e.g.
# `build/content/blog/<slug>/index.json`), then work out how many pagination pages we need to
# generate.
#
# Note: Page 1 is rendered by the normal Makefile rule.

COUNT=$(find "build/content/${SECTION}" -mindepth 2 -name index.json | wc -l | tr -d ' ')
TOTAL=$(( (COUNT + PAGE_SIZE - 1) / PAGE_SIZE ))

RENDER="${RENDER:-target/debug/render}"
RENDER_FLAGS="${RENDER_FLAGS:-}"

for ((n = 2; n <= TOTAL; n++)); do
  out="output/${SECTION}/page/${n}/index.html"
  mkdir -p "$(dirname "$out")"
  jq --argjson n "$n" '. + {page_number: $n}' "$INDEX_JSON" \
    | "$RENDER" $RENDER_FLAGS -o "$out" "$TEMPLATE"
done
