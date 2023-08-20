import IndexDoc from "../document/document";
import { IndexDocLocations } from "../document/location";
import Load from "../encoding/load";
import { mergeRanges, Range } from "../tree/node";
import Tree from "../tree/tree";
import { MAGIC } from "./builder";
import { DecoderStats } from "./stats";
import { tokenizePhrasing } from "./tokens";

export interface SearchPositions {
  location_id: number;
  ranges: Range[];
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
        mergeRanges(existing.ranges, position.ranges);
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

export default class PreparedIndex {
  public documents: Map<number, IndexDoc> = new Map();
  public locations: IndexDocLocations = new IndexDocLocations();
  public tree: Tree = new Tree();

  public searchTerm(
    term: string,
    docId?: number
  ): Map<number, SearchPositions[]> {
    const found_locations = this.tree.search(term);

    // Iterate through the set of locations, and build a mapping from an IndexDoc ID to an object containing the
    // selector and list of positions.
    let results: Map<number, SearchPositions[]> = new Map();
    for (const [location_id, positions] of found_locations) {
      const location = this.locations.getLocation(location_id)!;

      // If we're only looking for a certain document, and this location isn't in that document, skip it.
      if (typeof docId === "number" && location.docId !== docId) {
        continue;
      }

      const result = results.get(location.docId);
      if (result) {
        result.push({ location_id, ranges: positions });
      } else {
        results.set(location.docId, [{ location_id, ranges: positions }]);
      }
    }

    return results;
  }

  public search(input: string, docId?: number): Map<number, SearchPositions[]> {
    const tokens = tokenizePhrasing(input);
    if (tokens.length === 0) {
      return new Map();
    }

    const matches = tokens.map((token) => this.searchTerm(token.text, docId));

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

  public static load(load: Load): PreparedIndex {
    const start = performance.now();
    const stats = new DecoderStats(load.length);
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

    let doc_count = load.readUintVlq();
    while (doc_count-- > 0) {
      const doc = IndexDoc.load(load);
      index.documents.set(doc.id, doc);
      stats.sizes.documents++;
    }

    index.locations = IndexDocLocations.load(load, stats);
    index.tree = Tree.load(load, stats);
    stats.timings.load = performance.now() - start;
    stats.log();

    return index;
  }
}
