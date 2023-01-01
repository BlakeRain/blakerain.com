import { promises as fs } from "fs";
import path from "path";

import { Encoder } from "./search/store";
import { PreparedIndex } from "./search/index";

import { buildSearchIndex } from "./content";

// Write a `PreparedIndex` to the given file under `/public/data/` directory.
async function writeIndex(filename: string, index: PreparedIndex) {
  // Create a new binary encoder
  const encoder = new Encoder();
  // Encode the prepared index using the new encoder
  index.encode(encoder);
  // Write the contents of the encoder to the destination file.
  return fs.writeFile(
    path.join(process.cwd(), "public", "data", filename),
    Buffer.from(encoder.finish())
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
  await fs.mkdir(path.join(process.cwd(), "public", "data"), {
    recursive: true,
  });
  await writeIndex("search.bin", await buildSearchIndex());
  console.log("Search index generated");
}
