import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import { walkStruct } from "../document/structure";
import Tree from "../tree/tree";
import PreparedIndex from "./prepared";
import { tokenizeCode, tokenizePhrasing } from "./tokens";

export default class IndexBuilder {
  documents: Map<number, IndexDoc> = new Map();
  locations: IndexDocLocations = new IndexDocLocations();
  tree: Tree = new Tree();

  constructor() {}

  public addDocument(doc: IndexDoc) {
    if (this.documents.has(doc.id)) {
      throw new Error(`Duplicate index document ID ${doc.id}`);
    }

    this.documents.set(doc.id, doc);
    for (const { path, tagName, content } of walkStruct(doc.structure)) {
      const tokens =
        tagName === "code" ? tokenizeCode(content) : tokenizePhrasing(content);
      if (tokens.length === 0) {
        continue;
      }

      const location_id = this.locations.addLocation(doc.id, path);
      for (const token of tokens) {
        this.tree.insert(token.text, location_id, {
          start: token.start,
          length: token.length,
        });
      }
    }
  }

  public prepare(): PreparedIndex {
    return new PreparedIndex(this);
  }
}
