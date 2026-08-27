#!/usr/bin/env bash
set -euo pipefail

JSON_FILE="$1"
STEM="$2" # (e.g. "foo/bar/index")

TEMPLATE=$(jq -r '.frontmatter.template // empty' "$JSON_FILE" 2>/dev/null)
if [ -n "$TEMPLATE" ]; then
  echo "$TEMPLATE"
  exit 0
fi

DIR=$(dirname "$STEM")
while true; do
  if [ "$DIR" = "." ]; then
    CANDIDATE="templates/page.html"
  else
    CANDIDATE="templates/$DIR/page.html"
  fi

  if [ -f "$CANDIDATE" ]; then
    echo "${CANDIDATE#templates/}"
    exit 0
  fi

  if [ "$DIR" = "." ]; then
    break
  fi

  DIR=$(dirname "$DIR")
done

echo "page.html"
