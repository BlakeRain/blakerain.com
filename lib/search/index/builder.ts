import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import { StructNode, walkStruct } from "../document/structure";
import Store from "../encoding/store";
import Tree from "../tree/tree";
import { BuilderSizes } from "./stats";
import { tokenizeCode, tokenizePhrasing } from "./tokens";

export const MAGIC = 0x53524348;

export default class IndexBuilder {
  sizes: BuilderSizes = new BuilderSizes();
  documents: Map<number, IndexDoc> = new Map();
  locations: IndexDocLocations = new IndexDocLocations();
  tree: Tree = new Tree();

  constructor() {}

  public addDocument(doc: IndexDoc, structure: StructNode[]) {
    if (this.documents.has(doc.id)) {
      throw new Error(`Duplicate index document ID ${doc.id}`);
    }

    this.documents.set(doc.id, doc);
    this.sizes.documents += 1;

    for (const { path, tagName, content } of walkStruct(structure)) {
      const tokens =
        tagName === "code" ? tokenizeCode(content) : tokenizePhrasing(content);
      if (tokens.length === 0) {
        continue;
      }

      this.sizes.tokens += tokens.length;
      this.sizes.locations += 1;

      const location_id = this.locations.addLocation(doc.id, path);
      for (const token of tokens) {
        this.tree.insert(token.text, location_id, {
          start: token.start,
          length: token.length,
        });
      }
    }
  }

  public store(store: Store) {
    store.writeUint32(MAGIC);

    // Store the document information
    store.writeUintVlq(this.documents.size);
    for (const doc of this.documents.values()) {
      doc.store(store);
    }

    this.locations.store(store);
    this.tree.store(store, this.sizes);
    this.sizes.size = store.length;
  }
}
