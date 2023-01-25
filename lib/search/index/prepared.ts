import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import Load from "../encoding/load";
import Store from "../encoding/store";
import { Position } from "../tree/node";
import Tree from "../tree/tree";
import IndexBuilder from "./builder";
import { fromByteArray, toByteArray } from "base64-js";

const MAGIC = 0x53524348;

export interface SearchPositions {
  location_id: number;
  positions: Position[];
}

export default class PreparedIndex {
  public documents: Map<number, IndexDoc> = new Map();
  public locations: IndexDocLocations;
  public tree: Tree;

  constructor(index?: IndexBuilder) {
    if (index) {
      for (const [id, doc] of index.documents) {
        this.documents.set(id, doc);
      }

      this.locations = index.locations;
      this.tree = index.tree;
    } else {
      this.locations = new IndexDocLocations();
      this.tree = new Tree();
    }
  }

  public static encodePositions(positions: SearchPositions[]): string {
    const store = new Store();

    store.writeUintVlq(positions.length);
    for (const position of positions) {
      store.writeUintVlq(position.location_id);
      store.writeUintVlq(position.positions.length);
      for (const pos of position.positions) {
        store.writeUintVlq(pos.start);
        store.writeUintVlq(pos.length);
      }
    }

    const buffer = store.finish();
    return encodeURIComponent(fromByteArray(new Uint8Array(buffer)));
  }

  public static decodePositions(encoded: string): SearchPositions[] {
    const buffer = toByteArray(decodeURIComponent(encoded)).buffer;
    const load = new Load(buffer);
    const positions: SearchPositions[] = [];

    let npositions = load.readUintVlq();
    while (npositions-- > 0) {
      const location_id = load.readUintVlq();
      const location_positions: Position[] = [];

      let nlocpos = load.readUintVlq();
      while (nlocpos-- > 0) {
        const start = load.readUintVlq();
        const length = load.readUintVlq();
        location_positions.push({ start, length });
      }

      positions.push({ location_id, positions: location_positions });
    }

    return positions;
  }

  public search(term: string): Map<number, SearchPositions[]> {
    const found_locations = this.tree.search(term);

    // Iterate through the set of locations, and build a mapping from an IndexDoc ID to an object containing the
    // selector and list of positions.
    let results: Map<number, SearchPositions[]> = new Map();
    for (const [location_id, positions] of found_locations) {
      const location = this.locations.getLocation(location_id)!;
      const result = results.get(location.docId);

      if (result) {
        result.push({ location_id, positions });
      } else {
        results.set(location.docId, [{ location_id, positions }]);
      }
    }

    return results;
  }

  public store(store: Store) {
    store.writeUint32(MAGIC);

    // Store the document information
    store.writeUintVlq(this.documents.size);
    for (const doc of this.documents.values()) {
      doc.store(store);
    }

    this.locations.store(store);
    this.tree.store(store);
  }

  public static load(load: Load): PreparedIndex {
    console.log(
      `Loading prepared index from blob of ${(load.length / 1024.0).toFixed(
        2
      )} Kib`
    );

    const magic = load.readUint32();
    if (magic !== MAGIC) {
      console.error(
        `Expected file magic 0x${MAGIC.toString(16)}, found 0x${magic.toString(
          16
        )}`
      );
      throw new Error(`Invalid prepared index file`);
    }

    const index = new PreparedIndex();

    const doc_start = performance.now();
    let doc_count = load.readUintVlq();
    while (doc_count-- > 0) {
      const doc = IndexDoc.load(load);
      index.documents.set(doc.id, doc);
    }

    console.log(
      `Loaded ${index.documents.size} documents in ${(
        performance.now() - doc_start
      ).toFixed(2)} ms`
    );

    index.locations = IndexDocLocations.load(load);
    index.tree = Tree.load(load);

    return index;
  }
}
