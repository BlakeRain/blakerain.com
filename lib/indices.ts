import { promises as fs } from "fs";
import path from "path";

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRehype from "remark-rehype";
import remarkEmoji from "remark-emoji";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeImageSize from "rehype-img-size";
import { Root } from "hast";

import Store from "./search/encoding/store";
import IndexDoc from "./search/document/document";
import { fromHast } from "./search/document/structure";
import IndexBuilder from "./search/index/builder";
import PreparedIndex from "./search/index/prepared";

import { loadDocSource, Preamble } from "./content";
import { rehypeWrapFigures, remarkUnwrapImages } from "./plugins";

// Create the unified processor that we use to parse markdown into HTML.
function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkMdx)

    .use(remarkUnwrapImages)
    .use(remarkEmoji)
    .use(remarkGfm)
    .use(remarkRehype)

    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypeImageSize, { dir: "public" })
    .use(rehypeWrapFigures);
}

// Load a search document from a markdown file.
async function loadSearchDoc<P extends Preamble & { cover?: string }>(
  id: number,
  page: boolean,
  doc_path: string
): Promise<IndexDoc | null> {
  const slug = path.basename(doc_path).replace(".md", "");
  const { preamble, source } = await loadDocSource<P>(doc_path);
  if (typeof preamble.search === "boolean" && !preamble.search) {
    return null;
  }

  const doc = new IndexDoc(id, slug, preamble.title || "No Title");

  if (preamble.published) {
    doc.published = preamble.published;
  }

  if (preamble.cover) {
    doc.cover = preamble.cover;
  }

  if (preamble.excerpt) {
    doc.excerpt = preamble.excerpt;
  }

  doc.page = page;

  // Process the markdown source to HTML.
  const processor = createProcessor();
  const root = processor.parse(source);
  const hast = processor.runSync(root);

  // Convert the HTML to a structured representation.
  doc.structure = fromHast(hast as Root);

  return doc;
}

/// Build the search index over all pages and blog posts.
///
/// This will return the `PreparedIndex` that can be serialized to a binary file.
async function buildSearchIndex(): Promise<PreparedIndex> {
  const index = new IndexBuilder();
  let doc_index = 0;

  // Iterate through all the pages, extract their source, and add it to the `IndexBuilder`.
  const pagesDir = path.join(process.cwd(), "content", "pages");
  for (let filename of await fs.readdir(pagesDir)) {
    const doc = await loadSearchDoc(
      doc_index++,
      true,
      path.join(pagesDir, filename)
    );

    if (doc) {
      index.addDocument(doc);
    }
  }

  // Iterate through all the blog posts, extract their source, and add it to the `IndexBuilder`.
  const postsDir = path.join(process.cwd(), "content", "posts");
  for (let filename of await fs.readdir(postsDir)) {
    const doc = await loadSearchDoc(
      doc_index++,
      false,
      path.join(postsDir, filename)
    );

    if (doc) {
      index.addDocument(doc);
    }
  }

  console.log(`Added ${doc_index} documents to search index`);

  // Prepare the final index and return it.
  return index.prepare();
}

// Write a `PreparedIndex` to the given file under `/public/data/` directory.
async function writeIndex(filename: string, index: PreparedIndex) {
  // Create a new binary store.
  const store = new Store();

  // Encode the prepared index using the store
  index.store(store);
  const data = store.finish();

  console.log(
    `Stored search index is ${(data.byteLength / 1024.0).toFixed(
      2
    )} Kib in size`
  );

  // Write the contents of the encoder to the destination file.
  return fs.writeFile(
    path.join(process.cwd(), "public", "data", filename),
    Buffer.from(store.finish())
  );
}

/// Generate all the search indices for this site.
///
/// Currently we only have the one index, which we store under `/public/data/search.bin` and indexes all pages and blog
/// posts.
///
/// This function will use the `buildSearchIndex` function from the `content` module to build a `PreparedIndex`, which
/// we then store to the `/public/data/search.bin` file.
export async function generateIndices() {
  // Create the 'data' directory in the 'public' directory if it doesn't exist. This is where we store the prepared
  // index, and is what will be served by CloudFront.
  await fs.mkdir(path.join(process.cwd(), "public", "data"), {
    recursive: true,
  });

  // Create the search index and write it to 'search.bin'.
  await writeIndex("search.bin", await buildSearchIndex());

  console.log("Search index generated");
}
