import { promises as fs } from "fs";
import path from "path";
import { Feed, Item } from "feed";
import { parseISO } from "date-fns";

import { loadPostInfos } from "../lib/content";

const BASE_URL = "https://www.blakerain.com";

async function main() {
  const now = new Date();
  const feed = new Feed({
    title: "Blake Rain",
    description: "Feed of blog posts on the website of Blake Rain",
    id: `${BASE_URL}/`,
    link: `${BASE_URL}/`,
    language: "en",
    image: `${BASE_URL}/media/logo-text.png`,
    favicon: `${BASE_URL}/favicon.png`,
    copyright: `All Rights Reserved ${now.getFullYear()}, Blake Rain`,
    updated: now,
    feedLinks: {
      json: `${BASE_URL}/feeds/feed.json`,
      atom: `${BASE_URL}/feeds/atom.xml`,
      rss2: `${BASE_URL}/feeds/feed.xml`,
    },
    author: {
      name: "Blake Rain",
      email: "blake.rain@blakerain.com",
      link: `${BASE_URL}/about`,
    },
  });

  const posts = await loadPostInfos();
  for (const post of posts) {
    const post_url = `${BASE_URL}/blog/${post.slug}`;
    const item: Item = {
      title: post.title,
      id: post_url,
      link: post_url,
      date: parseISO(post.published),
      author: [
        {
          name: "Blake Rain",
          email: "blake.rain@blakerain.com",
          link: `${BASE_URL}/about`,
        },
      ],
    };

    if (post.excerpt) {
      item.description = post.excerpt;
    }

    if (post.coverImage) {
      item.image = `${BASE_URL}${post.coverImage}`;
    }

    feed.addItem(item);
  }

  await fs.mkdir(path.join("public", "feeds"), { recursive: true });
  await fs.writeFile(path.join("public", "feeds", "feed.xml"), feed.rss2());
  await fs.writeFile(path.join("public", "feeds", "feed.json"), feed.json1());
  await fs.writeFile(path.join("public", "feeds", "atom.xml"), feed.atom1());
}

main();
