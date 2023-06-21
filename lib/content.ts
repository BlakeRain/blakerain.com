import { promises as fs } from "fs";
import path from "path";
import { TagId } from "./tags";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeImageSize from "rehype-img-size";
import matter from "gray-matter";
import { GitLogEntry, loadFileRevisions } from "./git";
import {
  rehypeAddPaths,
  rehypeWrapFigures,
  remarkUnwrapImages,
} from "./plugins";

/// Information about a document
export interface DocInfo {
  /// The slug used to form the URL for the document.
  slug: string;
  /// The rendered title for the document.
  title: string;
  /// Any excerpt given in indices or at the start of a document.
  excerpt: string | null;
  /// The ISO-8601 date string on which the document was published.
  published: string;
}

/// Interface for something that has a number of tags.
export interface Tagged {
  /// The tags (if any) for this object.
  tags: TagId[];
}

/// Summary information about a blog post.
///
/// This extends both `DocInfo` for summary information about the document and `Tagged` to associate tags with a blog
/// post.
export interface PostInfo extends DocInfo, Tagged {
  /// The amount of time it will roughly take to read the blog post.
  readingTime: number;
  /// URL for the cover image (if there is one).
  coverImage: string | null;
}

/// A fully deserialized blog post.
///
/// This interface extends `PostInfo` to include the content of the blog post.
export interface Post extends PostInfo {
  /// The content of the blog post, as parsed by MDX.
  content: MDXRemoteSerializeResult;
  /// Any pre-amble data for the blog post.
  preamble: PostPreamble;
  /// The git history of changes made to this blog post.
  history: GitLogEntry[];
}

/// A full deserialized page.
///
/// This interface extends `DocInfo` to include the contents of the page.
export interface Page extends DocInfo {
  /// The content of the page, as parsed by MDX.
  content: MDXRemoteSerializeResult;
  /// Any pre-amble data for the page.
  preamble: PagePreamble;
}

/// Represents general document preamble.
///
/// Preambles are provided using YAML in the frontispiece of a markdown document. This structure represents the basic
/// information extracted from the preamble for all documents (posts or pages).
export interface Preamble {
  /// The title of the document (if any).
  title?: string;
  /// When the document was published (if any, as an ISO-8601 string).
  published?: string;
  /// The excerpt for the document (if any).
  excerpt?: string;
  /// Whether to include the git history of this document.
  history?: boolean;
  /// Should we index this post for search (default is 'true').
  search?: boolean;
}

/// Preamble specific to a blog post.
export interface PostPreamble extends Preamble {
  /// The cover image URL.
  cover?: string;
  /// The IDs (slugs) of the tags for this post.
  tags?: TagId[];
}

/// Preamble specific to a page.
export interface PagePreamble extends Preamble {
  /// SEO settings for the page.
  seo?: {
    /// Whether to include this page for indexing.
    index?: boolean;
    /// Whether robots should follow links from this page.
    follow?: boolean;
  };
}

const WORD_RE = /[a-zA-Z0-9_-]\w+/;

// Roughly count the words in a source string.
function countWords(source: string): number {
  return source.split(/\s+/).filter((word) => WORD_RE.exec(word)).length;
}

// Load the document source for a given path.
//
// This function will load the source at the given path and split out any front-matter.
export async function loadDocSource<P extends Preamble>(
  doc_path: string
): Promise<{ preamble: P; source: string }> {
  const source = await fs.readFile(doc_path, "utf-8");
  const { content, data } = matter(source, {});
  return {
    preamble: data as P,
    source: content,
  };
}

// Load a document from the given path.
//
// This function will load the document from the given path using `loadDocSource`. It will then parse the contents of
// the document, returning the components needed to produce the various interfaces such as a `Post` or `Page`.
//
// 1. Count the number of words in the document.
// 2. Use MDX to parse the contents of the document, including our chosen remark and rehype plugins.
// 3. Load and parse the git history for the file (unless instructed otherwise).
async function loadDoc<P extends Preamble>(
  doc_path: string
): Promise<{
  preamble: P;
  source: string;
  wordCount: number;
  content: MDXRemoteSerializeResult;
  history: GitLogEntry[];
}> {
  const { preamble, source } = await loadDocSource<P>(doc_path);
  return {
    preamble,
    source,
    wordCount: countWords(source),
    content: await serialize(source, {
      scope: preamble as Record<string, any>,
      mdxOptions: {
        development: process.env.NODE_ENV === "development",
        remarkPlugins: [remarkUnwrapImages, remarkGfm, remarkEmoji],
        rehypePlugins: [
          rehypeSlug,
          rehypeAutolinkHeadings,
          [rehypeImageSize as any, { dir: "public" }],
          rehypeWrapFigures,
          rehypeAddPaths,
        ],
      },
    }),
    history:
      preamble.history !== false ? await loadFileRevisions(doc_path) : [],
  };
}

// Parse the date received in some preamble.
//
// Dates can be stored either as strings or a `Date` object (due to helpful YAML parsing), or be missing. In all three
// cases we try to extract an ISO-8601 string that we can serialize to JSON.
function processDate(date: string | Date | undefined): string {
  if (typeof date === "string") {
    return date;
  } else if (typeof date === "undefined") {
    return "2020-01-01T09:00:00.000Z";
  } else {
    return date.toISOString();
  }
}

// Parse any date-like objects found in the given object.
//
// This goes some way to ensure that the `Record` doesn't contain any `Date` objects, which we cannot serialize to JSON.
// Instead all dates should be stored as ISO-8601 strings.
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

// Given a path to a document and some preamble, build the `DocInfo`.
//
// This function constructs the `DocInfo` interface using the given data:
//
// 1. The `slug` of the document is the document's filename without the '.md' extension.
// 2. The title is "Untitled" unless a title is provided in the preamble.
// 3. The excerpt is extracted from the preamble (if there is any).
// 4. The `published` date string is retrieved from the preamble (if there is any).
export function extractDocInfo(
  filename: string,
  preamble: PagePreamble
): DocInfo {
  return {
    slug: path.basename(filename).replace(".md", ""),
    title: preamble.title || "Untitled",
    excerpt: preamble.excerpt || null,
    published: processDate(preamble.published),
  };
}

// Given a path to a document and some preamble, build the `PostInfo`.
//
// This function builds the `PostInfo` by first building the `DocInfo` that `PostInfo` extends using the
// `extractDocInfo` function defined above. This function then extracts the following:
//
// 1. The `coverImage` is extracted from the preamble if one is present. A `/` is prepended to the cover image path if
//    one is not already present.
// 2. The `readingTime` is "calculated" by dividing the number of words in the document by 200.
// 3. The `tags` are extracted from the preamble if any are present.
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

/// Load a `Page` from the given path.
export async function loadPage(doc_path: string): Promise<Page> {
  const { preamble, content } = await loadDoc<PagePreamble>(doc_path);
  return {
    ...extractDocInfo(doc_path, preamble),
    preamble: processDates(preamble),
    content,
  };
}

/// Load the slugs for all pages in the site.
export async function loadPageSlugs(): Promise<string[]> {
  const pagesDir = path.join(process.cwd(), "content", "pages");
  const filenames = await fs.readdir(pagesDir);

  return filenames.map((filename) =>
    path.basename(filename).replace(".md", "")
  );
}

/// Load a `Page` with the given slug.
export async function loadPageWithSlug(slug: string): Promise<Page> {
  const pagePath = path.join(process.cwd(), "content", "pages", slug + ".md");
  return await loadPage(pagePath);
}

// --------------------------------------------------------------------------------------------------------------------

/// Load a `Post` from the given path.
export async function loadPost(doc_path: string): Promise<Post> {
  const { preamble, wordCount, content, history } = await loadDoc<PostPreamble>(
    doc_path
  );
  return {
    ...extractPostInfo(doc_path, preamble, wordCount),
    preamble: processDates(preamble),
    history,
    content,
  };
}

/// Load the slugs for all posts in the site.
export async function loadPostSlugs(): Promise<string[]> {
  const postsDir = path.join(process.cwd(), "content", "posts");
  const filenames = await fs.readdir(postsDir);

  return filenames.map((filename) =>
    path.basename(filename).replace(".md", "")
  );
}

/// Load all `PostInfo` for the posts in the site.
///
/// This is used to build the index of blog posts, where only some summary information of a post is required (as encoded
/// by the `PostInfo` interface). This function will also sort the results by descending published date.
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
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime()
  );
}

/// Load a `Post` with the given slug.
export async function loadPostWithSlug(slug: string): Promise<Post> {
  const postPath = path.join(process.cwd(), "content", "posts", slug + ".md");
  return await loadPost(postPath);
}
