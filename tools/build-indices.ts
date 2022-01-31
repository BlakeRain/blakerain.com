import { promises as fs } from "fs";
import path from "path";

import { Encoder } from "../lib/search/store";
import { PreparedIndex } from "../lib/search/index";

import { buildSearchIndex } from "../lib/content";

async function writeIndex(filename: string, index: PreparedIndex) {
  index.describe();
  const encoder = new Encoder();
  index.encode(encoder);
  return fs.writeFile(
    path.join("public", "data", filename),
    Buffer.from(encoder.finish())
  );
}

async function main() {
  await fs.mkdir(path.join("public", "data"), { recursive: true });
  await writeIndex("search.bin", await buildSearchIndex());
  console.log("Search index generated");
}

main();
