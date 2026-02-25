#!/usr/bin/env bash
set -euo pipefail

JSON_FILE="$1"
STEM="$2"  # e.g., "foo/bar/index"

# 1. Check frontmatter.template in the JSON
TEMPLATE=$(jq -r '.frontmatter.template // empty' "$JSON_FILE" 2>/dev/null)
if [ -n "$TEMPLATE" ]; then
    echo "$TEMPLATE"
    exit 0
fi

# 2. Walk up the directory tree looking for a matching template
DIR=$(dirname "$STEM")
while true; do
    if [ "$DIR" = "." ]; then
        CANDIDATE="templates/page.html"
    else
        CANDIDATE="templates/${DIR}/page.html"
    fi

    if [ -f "$CANDIDATE" ]; then
        # Return path relative to templates/
        echo "${CANDIDATE#templates/}"
        exit 0
    fi

    # Reached the top without finding anything
    if [ "$DIR" = "." ]; then
        break
    fi

    DIR=$(dirname "$DIR")
done

# Fallback
echo "page.html"
