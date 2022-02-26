import { promises as fs } from "fs";
import path from "path";
import { parseISO } from "date-fns";
import { Node } from "unist";
import * as hast from "hast";
import * as mdast from "mdast";
import { TagId } from "./tags";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import { remarkMdxCodeMeta } from "remark-mdx-code-meta";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeImageSize from "rehype-img-size";
import matter from "gray-matter";
import { IndexBuilder, PreparedIndex } from "./search";

export interface DocInfo {
  slug: string;
  title: string;
  excerpt: string | null;
  published: string;
}

export interface Tagged {
  tags: TagId[];
}

export interface PostInfo extends DocInfo, Tagged {
  readingTime: number;
  coverImage: string | null;
}

export interface Post extends PostInfo {
  content: MDXRemoteSerializeResult;
  preamble: PostPreamble;
}

export interface Page extends DocInfo {
  content: MDXRemoteSerializeResult;
  preamble: PagePreamble;
}

export interface Preamble {
  draft?: boolean;
  title?: string;
  published?: string;
  excerpt?: string;
}

export interface PostPreamble extends Preamble {
  cover?: string;
  tags?: TagId[];
}

export interface PagePreamble extends Preamble {
  seo?: {
    index?: boolean;
    follow?: boolean;
  };
}

function remarkPlugin() {
  function transformChildren(node: mdast.Parent) {
    node.children = node.children.map((child) =>
      walkNode(child)
    ) as mdast.Content[];
  }

  function walkNode(node: Node): Node {
    switch (node.type) {
      case "root":
        transformChildren(node as mdast.Root);
      case "paragraph": {
        const paragraph = node as mdast.Paragraph;
        if (
          paragraph.children.length === 1 &&
          paragraph.children[0].type === "image"
        ) {
          return walkNode(paragraph.children[0]);
        } else {
          transformChildren(paragraph);
        }
        break;
      }
    }

    return node;
  }

  return (tree: Node) => {
    return walkNode(tree);
  };
}

function rehypePlugin() {
  function transformChildren(node: hast.Parent) {
    node.children = node.children.map((child) =>
      walkNode(child)
    ) as hast.Content[];
  }

  function walkNode(node: Node): Node {
    switch (node.type) {
      case "root": {
        transformChildren(node as hast.Root);
      }

      case "element": {
        const element = node as hast.Element;
        switch (element.tagName) {
        }
      }
    }

    return node;
  }

  return (tree: Node) => {
    walkNode(tree);
  };
}

const WORD_RE = /[a-zA-Z0-9_-]\w+/;

function countWords(source: string) {
  return source.split(/\s+/).filter((word) => WORD_RE.exec(word)).length;
}

async function loadDocSource<P extends Preamble>(
  filename: string
): Promise<{ preamble: P; source: string }> {
  const source = await fs.readFile(filename, "utf-8");
  const { content, data } = matter(source, {});
  return {
    preamble: data as P,
    source: content,
  };
}

async function loadDoc<P extends Preamble>(
  filename: string
): Promise<{
  preamble: P;
  source: string;
  wordCount: number;
  content: MDXRemoteSerializeResult;
}> {
  const { preamble, source } = await loadDocSource<P>(filename);
  return {
    preamble,
    source,
    wordCount: countWords(source),
    content: await serialize(source, {
      scope: preamble as Record<string, any>,
      mdxOptions: {
        remarkPlugins: [remarkPlugin, remarkMdxCodeMeta, remarkGfm],
        rehypePlugins: [
          rehypePlugin,
          rehypeSlug,
          rehypeAutolinkHeadings,
          [rehypeImageSize as any, { dir: "public" }],
        ],
      },
    }),
  };
}

function processDate(date: string | Date | undefined): string {
  if (typeof date === "string") {
    return date;
  } else if (typeof date === "undefined") {
    return "2020-01-01T09:00:00.000Z";
  } else {
    return date.toISOString();
  }
}

function processDates(obj: Record<string, any>): Record<string, any> {
  Object.keys(obj).forEach((key) => {
    let value = obj[key];

    if (value instanceof Date) {
      obj[key] = value.toISOString();
    } else if (typeof value === "object") {
      obj[key] = processDates(value);
    }
  });

  return obj;
}

function extractDocInfo(filename: string, preamble: PagePreamble): DocInfo {
  return {
    slug: path.basename(filename).replace(".md", ""),
    title: preamble.title || "Untitled",
    excerpt: preamble.excerpt || null,
    published: processDate(preamble.published),
  };
}

function extractPostInfo(
  filename: string,
  preamble: PostPreamble,
  wordCount: number
): PostInfo {
  const obj = extractDocInfo(filename, preamble) as PostInfo;
  obj.coverImage = preamble.cover || null;
  if (typeof obj.coverImage === "string" && !obj.coverImage.startsWith("/")) {
    obj.coverImage = "/" + obj.coverImage;
  }
  obj.readingTime = Math.trunc(wordCount / 200);
  obj.tags = preamble.tags || [];
  return obj;
}

// --------------------------------------------------------------------------------------------------------------------

export async function loadPage(filename: string): Promise<Page> {
  const { preamble, content } = await loadDoc<PagePreamble>(filename);
  return {
    ...extractDocInfo(filename, preamble),
    preamble: processDates(preamble),
    content,
  };
}

export async function loadPageSlugs(): Promise<string[]> {
  const pagesDir = path.join(process.cwd(), "content", "pages");
  const filenames = await fs.readdir(pagesDir);

  return filenames.map((filename) =>
    path.basename(filename).replace(".md", "")
  );
}

export async function loadPageWithSlug(slug: string): Promise<Page> {
  const pagePath = path.join(process.cwd(), "content", "pages", slug + ".md");
  return await loadPage(pagePath);
}

// --------------------------------------------------------------------------------------------------------------------

export async function loadPost(filename: string): Promise<Post> {
  const { preamble, wordCount, content } = await loadDoc<PostPreamble>(
    filename
  );
  return {
    ...extractPostInfo(filename, preamble, wordCount),
    preamble: processDates(preamble),
    content,
  };
}

export async function loadPostSlugs(): Promise<string[]> {
  const postsDir = path.join(process.cwd(), "content", "posts");
  const filenames = await fs.readdir(postsDir);

  return filenames.map((filename) =>
    path.basename(filename).replace(".md", "")
  );
}

export async function loadPostInfos(): Promise<PostInfo[]> {
  const postsDir = path.join(process.cwd(), "content", "posts");
  const filenames = await fs.readdir(postsDir);

  const posts = await Promise.all(
    filenames.map(async (filename) => {
      const { preamble, source } = await loadDocSource<PostPreamble>(
        path.join(postsDir, filename)
      );
      return extractPostInfo(filename, preamble, countWords(source));
    })
  );

  return posts.sort(
    (a, b) => parseISO(b.published).getTime() - parseISO(a.published).getTime()
  );
}

export async function loadPostWithSlug(slug: string): Promise<Post> {
  const postPath = path.join(process.cwd(), "content", "posts", slug + ".md");
  return await loadPost(postPath);
}

// --------------------------------------------------------------------------------------------------------------------

export async function buildSearchIndex(): Promise<PreparedIndex> {
  const index = new IndexBuilder();

  const pagesDir = path.join(process.cwd(), "content", "pages");
  for (let filename of await fs.readdir(pagesDir)) {
    const { preamble, source } = await loadDocSource(
      path.join(pagesDir, filename)
    );

    const { slug, title, excerpt } = extractDocInfo(filename, preamble);
    index.addDocument(true, slug, title, excerpt || "", source);
  }

  const postsDir = path.join(process.cwd(), "content", "posts");
  for (let filename of await fs.readdir(postsDir)) {
    const { preamble, source } = await loadDocSource(
      path.join(postsDir, filename)
    );

    const { slug, title, excerpt } = extractDocInfo(filename, preamble);
    index.addDocument(false, slug, title, excerpt || "", source);
  }

  return index.prepare();
}
