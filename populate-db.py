#!/usr/bin/env python3

import bs4
import os
import sqlite3
import requests


def extract_content(source):
    soup = bs4.BeautifulSoup(source, features="html.parser")
    for script in soup(["script", "style"]):
        script.extract()
    return soup.get_text()


DB_PATH = os.environ.get("DB_PATH", "/var/www/ghost-search.db")
DOMAIN = os.environ.get("DOMAIN", "blakerain.com")
API_KEY = os.environ.get("API_KEY")
URL_BASE = f"https://{DOMAIN}/ghost/api/v2/content/"

conn = sqlite3.connect(DB_PATH)
conn.execute("""
CREATE VIRTUAL TABLE IF NOT EXISTS posts USING fts3(
  post_id TEXT,
  url TEXT,
  date TEXT,
  image TEXT,
  title TEXT,
  excerpt TEXT,
  content TEXT
);
""")
conn.commit()

PARAMS = {
    "key": API_KEY,
    "fields": "id,title,custom_excerpt,html,url,feature_image,published_at",
    "include": "tags",
    "page": 1
}

TAG_MATCHER = {
    "posts": lambda post: True,
    "pages": lambda page: "#searchable" in [tag["name"] for tag in page["tags"]]
}

for resource in ["posts", "pages"]:
    page = 1
    while True:
        print(
            f"Fetching page of {resource} from Ghost content API (page {page})")
        PARAMS["page"] = page
        r = requests.get(url=URL_BASE + resource, params=PARAMS)
        if r.status_code != 200:
            print(f"  Failed to fetch results: {r.status_code}")
            break
        data = r.json()
        c = conn.cursor()
        for post in data[resource]:
            print(
                f"  Found {resource} {post['id']}: {post['title']} ({post['url']})")
            if not TAG_MATCHER[resource](post):
                print(f"    Does not match required tags")
                continue
            content = extract_content(post["html"])
            c.execute("DELETE FROM posts WHERE post_id = ?", (post["id"], ))
            c.execute("INSERT INTO posts(post_id, url, date, image, title, excerpt, content) VALUES(?, ?, ?, ?, ?, ?, ?)",
                      (post["id"], post["url"], post["published_at"], post["feature_image"], post["title"], post["custom_excerpt"], content))
        if data["meta"]["pagination"]["pages"] <= page:
            print(f"  This is the last page")
            break
        page += 1
conn.commit()
