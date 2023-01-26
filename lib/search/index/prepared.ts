import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import Load from "../encoding/load";
import Store from "../encoding/store";
import { mergeRanges, Range } from "../tree/node";
import Tree from "../tree/tree";
import IndexBuilder from "./builder";
import { fromByteArray, toByteArray } from "base64-js";
import { tokenizePhrasing } from "./tokens";

const MAGIC = 0x53524348;

export interface SearchPositions {
  location_id: number;
  positions: Range[];
}

function mergeSearchPositions(
  left: SearchPositions[],
  right: SearchPositions[]
): SearchPositions[] {
  const combined: SearchPositions[] = [...left];

  for (const position of right) {
    let found = false;
    for (const existing of combined) {
      if (existing.location_id === position.location_id) {
        mergeRanges(existing.positions, position.positions);
        found = true;
        break;
      }
    }

    if (!found) {
      combined.push(position);
    }
  }

  // Sort the combined positions by location ID to ensure they are increasing
  return combined.sort((a, b) => a.location_id - b.location_id);
}

export function encodePositions(positions: SearchPositions[]): string {
  const store = new Store();

  for (const position of positions) {
    // Don't bother storing positions if there are none
    if (position.positions.length === 0) {
      continue;
    }

    store.writeUintVlq(position.location_id);
    for (let i = 0; i < position.positions.length; ++i) {
      store.writeUintVlq(
        (position.positions[i].start << 1) |
          (i < position.positions.length - 1 ? 0x01 : 0x00)
      );
      store.writeUintVlq(position.positions[i].length);
    }
  }

  const buffer = store.finish();
  return encodeURIComponent(fromByteArray(new Uint8Array(buffer)));
}

export function decodePositions(encoded: string): SearchPositions[] {
  const buffer = toByteArray(decodeURIComponent(encoded)).buffer;
  const load = new Load(buffer);
  const positions: SearchPositions[] = [];

  while (load.remaining > 0) {
    const location_id = load.readUintVlq();
    const location_positions: Range[] = [];

    for (;;) {
      const start = load.readUintVlq();
      const length = load.readUintVlq();

      location_positions.push({ start: start >> 1, length });
      if ((start & 0x01) === 0x00) {
        break;
      }
    }

    positions.push({ location_id, positions: location_positions });
  }

  return positions;
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

  public searchTerm(term: string): Map<number, SearchPositions[]> {
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

  public search(input: string): Map<number, SearchPositions[]> {
    const tokens = tokenizePhrasing(input);
    if (tokens.length === 0) {
      return new Map();
    }

    const matches = tokens.map((token) => this.searchTerm(token.text));

    // Build a set that combines the intersection of all document IDs
    let combined_ids: Set<number> | null = null;
    for (const match of matches) {
      const match_ids = new Set(match.keys());
      if (combined_ids === null) {
        combined_ids = match_ids;
      } else {
        for (const doc_id of combined_ids) {
          if (!match_ids.has(doc_id)) {
            combined_ids.delete(doc_id);
          }
        }
      }
    }

    // If we didn't find anything, or the intersection of documents was an empty set (no document(s) include all terms),
    // then the result of the search is empty.
    if (combined_ids === null || combined_ids.size === 0) {
      return new Map();
    }

    // Build the combined map
    const combined: Map<number, SearchPositions[]> = new Map();
    for (const match of matches) {
      for (const [document_id, positions] of match) {
        // If this document is not in the combined document IDs, then skip it.
        if (!combined_ids.has(document_id)) {
          continue;
        }

        if (!combined.has(document_id)) {
          combined.set(document_id, positions);
        } else {
          let current = combined.get(document_id)!;
          combined.set(document_id, mergeSearchPositions(current, positions));
        }
      }
    }

    return combined;
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
