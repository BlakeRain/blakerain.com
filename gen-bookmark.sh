#!/bin/bash
set -eo pipefail

if [ -z "$1" ]; then
  echo "Usage: $0 <URL>"
  exit 1
fi

# Download the HTML from the URL.
rawhtml=$(mktemp)
curl -s "$1" > "$rawhtml"

# Split out the metadata from the HTML to make subsequent queries easier.
meta=$(mktemp)
htmlq -f "$rawhtml" 'head > meta' > "$meta"

function get_content() {
  htmlq -f "$rawhtml" -a "$1" "meta[$2=\"$3\"]"
}

function get_og() {
  get_content content property "og:$1"
}

title=$(get_og title)

if [ -z "$title" ]; then
  title=$(get_content content name "twitter:title")
fi

description=$(get_og description)

if [ -z "$description" ]; then
  description=$(get_content content name "twitter:description")
fi

if [-z "$description"]; then
  description=$(get_content content name "description")
fi

thumbnail=$(get_og image)
publisher=$(get_og site_name)
icon=$(htmlq -f runst.html -a href 'link[rel="icon"]')
author=$(get_content content name "author")

rm "$rawhtml" "$meta"

echo "{{< bookmark"
echo "  url=\"$1\""
echo "  title=\"$title\""
echo "  description=\"$description\""
if [ -n "$author" ]; then
  echo "  author=\"$author\""
fi
echo "  publisher=\"$publisher\""
echo "  thumbnail=\"$thumbnail\""
echo "  icon=\"$icon\" >}}"
