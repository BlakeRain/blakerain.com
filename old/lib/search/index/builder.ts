import { Element, Node, Root, Text } from "hast";
import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import Store from "../encoding/store";
import Tree from "../tree/tree";
import { BuilderSizes } from "./stats";
import { tokenizeCode, tokenizePhrasing } from "./tokens";

export const MAGIC = 0x53524348;

interface WalkStructItem {
  path: number[];
  tagName: string;
  content: string;
}

function* walkStruct(root: Root): Generator<WalkStructItem> {
  let path: number[] = [];
  let index: number = 0;
  let nodes: Node[] = [...root.children];
  let tagName: string = "";
  let stack: { tagName: string; nodes: Node[] }[] = [];

  for (;;) {
    while (nodes.length > 0) {
      const node = nodes.shift()!;

      if (node.type === "text" && (node as Text).value.length > 0) {
        yield {
          path: [...path, index],
          tagName,
          content: (node as Text).value,
        };
        index += 1;
      } else if (node.type === "element") {
        path.push(index);
        stack.push({ tagName, nodes });

        const element = node as Element;
        nodes = [...element.children];
        index = 0;
        tagName = element.tagName;
      }
    }

    if (stack.length === 0) {
      break;
    }

    const top = stack.pop()!;
    nodes = top.nodes;
    tagName = top.tagName;
    index = path.pop()! + 1;
  }
}

export default class IndexBuilder {
  sizes: BuilderSizes = new BuilderSizes();
  documents: Map<number, IndexDoc> = new Map();
  locations: IndexDocLocations = new IndexDocLocations();
  tree: Tree = new Tree();

  constructor() {}

  public addDocument(doc: IndexDoc, structure: Root) {
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
