import { promises as fs } from "fs";
import path from "path";
import { parseISO } from "date-fns";
import { Root } from "mdast";
import YAML from "yaml";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";

const SHOULD_CACHE =
  typeof process.env.NO_DATA_CACHE === undefined ? true : false;

export interface SiteNavigation {
  label: string;
  url: string;
}

export async function loadNavigation(): Promise<SiteNavigation[]> {
  const navPath = path.join(process.cwd(), "content", "navigation.yaml");
  const navSrc = await fs.readFile(navPath, "utf-8");
  return YAML.parse(navSrc) as SiteNavigation[];
}

export interface DocInfo {
  slug: string;
  title: string;
  excerpt: string | null;
  published: string;
}

export interface Tag {
  slug: TagId;
  name: string;
  visibility?: "public" | "private";
  description?: string;
}

export type TagId = string;

export type Tags = { [id: string]: Tag };

var LOADED_TAGS: Tags | undefined = undefined;

export async function loadTags(): Promise<Tags> {
  if (SHOULD_CACHE && LOADED_TAGS) {
    return LOADED_TAGS;
  }

  const tagsPath = path.join(process.cwd(), "content", "tags.yaml");
  const tagsSrc = await fs.readFile(tagsPath, "utf-8");
  LOADED_TAGS = YAML.parse(tagsSrc) as Tags;

  console.log(
    `Loaded ${Object.keys(LOADED_TAGS).length} tag(s): ${Object.keys(
      LOADED_TAGS
    ).join(", ")}`
  );

  Object.keys(LOADED_TAGS).forEach((tag_id) => {
    const tag = (LOADED_TAGS as Tags)[tag_id];

    if (!tag.slug) {
      tag.slug = tag_id;
    }

    if (!tag.name) {
      tag.name = tag_id;
    }

    if (!tag.visibility) {
      tag.visibility = "public";
    }
  });

  return LOADED_TAGS;
}

export interface Tagged {
  tags: TagId[];
}

export interface PostInfo extends DocInfo, Tagged {
  readingTime: number;
  coverImage: string | null;
}

export interface Post extends PostInfo {
  root: Root;
}

export interface Page extends DocInfo {
  root: Root;
}

var LOADED_PAGES: Page[] = [];

export async function loadPages(): Promise<Page[]> {
  if (SHOULD_CACHE && LOADED_PAGES.length > 0) {
    console.log(`Using cached pages data (${LOADED_PAGES.length} pages)`);
    return LOADED_PAGES;
  }

  const pagesDir = path.join(process.cwd(), "content", "pages");
  const filenames = await fs.readdir(pagesDir);

  const pages = filenames.map(async (filename) => {
    // Load the contets of this page file
    console.log(`Loading: ${filename}`);
    const content = await fs.readFile(path.join(pagesDir, filename), "utf-8");

    // Parse the contents of the post
    const loaded = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkGfm)
      .parse(content);

    var preamble:
      | {
          draft?: boolean;
          slug?: string;
          title?: string;
          published?: string;
          excerpt?: string;
        }
      | undefined = undefined;

    if (loaded.children.length > 0 && loaded.children[0].type === "yaml") {
      try {
        preamble = YAML.parse(loaded.children[0].value);
      } catch (exc) {
        console.error(`Failed to parse preamble in ${filename} (${exc}):`);
        console.log(loaded.children[0].value);
        throw exc;
      }

      loaded.children.shift();
    }

    return {
      slug: preamble?.slug || path.basename(filename).replace(".md", ""),
      draft: preamble?.draft || false,
      title: preamble?.title || "Untitled",
      published: preamble?.published || "2000-01-01T00:00:00.000Z",
      excerpt: preamble?.excerpt || null,
      root: loaded,
    } as Page & { draft: boolean };
  });

  const loaded_pages = await Promise.all(pages);

  LOADED_PAGES = loaded_pages.filter((page) => !page.draft);
  console.log(`Loaded ${LOADED_PAGES.length} post(s)`);
  return LOADED_PAGES;
}

export async function getPageWithSlug(slug: string): Promise<Page> {
  const pages = await loadPages();
  for (let page of pages) {
    if (page.slug === slug) {
      return page;
    }
  }

  return Promise.reject("Unable to find page");
}

var LOADED_POSTS: Post[] = [];

export async function loadPosts(): Promise<Post[]> {
  if (SHOULD_CACHE && LOADED_POSTS.length > 0) {
    console.log(`Using cached posts data (${LOADED_POSTS.length} posts)`);
    return LOADED_POSTS;
  }

  const tags = await loadTags();
  const postsDir = path.join(process.cwd(), "content", "posts");
  const filenames = await fs.readdir(postsDir);

  const posts = filenames.map(async (filename) => {
    // Load the contets of this post file
    console.log(`Loading: ${filename}`);
    const content = await fs.readFile(path.join(postsDir, filename), "utf-8");

    // Parse the contents of the post
    const loaded = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkGfm)
      .parse(content);

    var preamble:
      | {
          draft?: boolean;
          slug?: string;
          title?: string;
          published?: string;
          excerpt?: string;
          cover?: string;
          tags?: TagId[];
        }
      | undefined = undefined;

    if (loaded.children.length > 0 && loaded.children[0].type === "yaml") {
      try {
        preamble = YAML.parse(loaded.children[0].value);
      } catch (exc) {
        console.error(`Failed to parse preamble in ${filename} (${exc}):`);
        console.log(loaded.children[0].value);
        throw exc;
      }

      loaded.children.shift();
    }

    return {
      slug: preamble?.slug || path.basename(filename).replace(".md", ""),
      draft: preamble?.draft || false,
      title: preamble?.title || "Untitled",
      published: preamble?.published || "2000-01-01T00:00:00.000Z",
      excerpt: preamble?.excerpt || null,
      coverImage: preamble?.cover || null,
      tags: preamble?.tags?.filter((tag_id) => {
        if (!(tag_id in tags)) {
          console.warn(
            `Cannot find tag with ID '${tag_id}' in post '${filename}'`
          );
          return false;
        }
        return true;
      }),
      root: loaded,
      readingTime: 0,
    } as Post & { draft: boolean };
  });

  const loaded_posts = await Promise.all(posts);

  LOADED_POSTS = loaded_posts.filter((post) => !post.draft);
  LOADED_POSTS.sort(
    (a, b) => parseISO(b.published).getTime() - parseISO(a.published).getTime()
  );

  console.log(`Loaded ${LOADED_POSTS.length} post(s)`);
  return LOADED_POSTS;
}

export async function loadPostInfos(): Promise<PostInfo[]> {
  const posts = await loadPosts();
  return posts.map(
    ({ slug, title, excerpt, tags, published, readingTime, coverImage }) => ({
      slug,
      title,
      excerpt,
      tags,
      published,
      readingTime,
      coverImage,
    })
  );
}

export async function getPostWithSlug(slug: string): Promise<Post> {
  const posts = await loadPosts();
  for (let post of posts) {
    if (post.slug === slug) {
      return post;
    }
  }

  return Promise.reject("Unable to find post");
}
