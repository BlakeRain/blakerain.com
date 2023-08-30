#!/usr/bin/env python3

from bs4 import BeautifulSoup
from bs4.element import Tag
import requests
import sys
import yaml

if len(sys.argv) < 2:
    sys.stderr.write("Usage: gen-bookmark.py <url>\n")
    sys.exit(1)

html = requests.get(sys.argv[1]).text
soup = BeautifulSoup(html, "html.parser")

meta = {}
for tag in soup.find_all("meta"):
    property = tag.get("property")
    if property is None:
        continue
    content = tag.get("content")
    if content is None:
        continue
    meta[property] = content

bookmark = { "url": meta.get("og:url", sys.argv[1]) }

bookmark["title"] = meta.get("og:title", "Untitled");

description = meta.get("og:description")
if description:
    bookmark["description"] = description

thumbnail = meta.get("og:image")
if thumbnail:
    bookmark["thumbnail"] = thumbnail

fluid_icon = soup.find("link", rel="fluid-icon")
if isinstance(fluid_icon, Tag):
    bookmark["icon"] = fluid_icon.get("href")
    bookmark["publisher"] = fluid_icon.get("title")

print("```bookmark")
print(yaml.dump(bookmark, indent=2) + "```")

