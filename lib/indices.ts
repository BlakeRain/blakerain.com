import { promises as fs } from "fs";
import path from "path";

import { Encoder } from "./search/store";
import { PreparedIndex } from "./search/index";

import { buildSearchIndex } from "./content";

async function writeIndex(filename: string, index: PreparedIndex) {
  const encoder = new Encoder();
  index.encode(encoder);
  return fs.writeFile(
    path.join(process.cwd(), "public", "data", filename),
    Buffer.from(encoder.finish())
  );
}

export async function generateIndices() {
  await fs.mkdir(path.join(process.cwd(), "public", "data"), {
    recursive: true,
  });
  await writeIndex("search.bin", await buildSearchIndex());
  console.log("Search index generated");
}