#!/usr/bin/env python3
import os
import sqlite3
import requests

DB_PATH = os.environ.get("DB_PATH", "/var/www/ghost-search.db")
DOMAIN = os.environ.get("DOMAIN", "blakerain.com")
API_KEY = os.environ.get("API_KEY")
URL_BASE = f"https://{DOMAIN}/ghost/api/v2/content/posts"

conn = sqlite3.connect(DB_PATH)
conn.execute("""
CREATE VIRTUAL TABLE IF NOT EXISTS posts USING fts3(
  post_id TEXT,
  url TEXT,
  title TEXT,
  excerpt TEXT,
  html TEXT
);
""")
conn.commit()

PARAMS = {
  "key": API_KEY,
  "fields": "id,title,custom_excerpt,html,url",
  "page": 1
}

page = 1
while True:
  print(f"Fetching page {page} from Ghost content API")
  r = requests.get(url = URL_BASE, params = PARAMS)
  data = r.json()
  c = conn.cursor()
  for post in data["posts"]:
    c.execute("DELETE FROM posts WHERE post_id = ?", (post["id"], ))
    c.execute("INSERT INTO posts(post_id, url, title, excerpt, html) VALUES(?, ?, ?, ?, ?)",
              (post["id"], post["url"], post["title"], post["custom_excerpt"], post["html"]))
  if data["meta"]["pagination"]["pages"] <= page:
    print(f"This is the last page")
    break
conn.commit()

