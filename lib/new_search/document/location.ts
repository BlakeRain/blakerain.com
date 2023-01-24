import Load from "../encoding/load";
import Store from "../encoding/store";

export class IndexDocLocation {
  /// The ID of the document in which this location is to be found.
  public docId: number;
  /// The path through the document structure to this location.
  public path: number[];

  constructor(docId: number, path: number[]) {
    this.docId = docId;
    this.path = path;
  }
}

/// A cache of all IndexDocLocation records
export class IndexDocLocations {
  public locations: Map<number, IndexDocLocation> = new Map();

  public addLocation(docId: number, path: number[]): number {
    const index = this.locations.size;
    this.locations.set(index, new IndexDocLocation(docId, path));
    return index;
  }

  public getLocation(id: number): IndexDocLocation | undefined {
    return this.locations.get(id);
  }

  public store(store: Store) {
    store.writeUintVlq(this.locations.size);
    for (const [id, location] of this.locations) {
      store.writeUintVlq(id);
      store.writeUintVlq(location.docId);
      store.writeUintVlqSeq(location.path);
    }
  }

  public static load(load: Load): IndexDocLocations {
    const locations = new IndexDocLocations();
    const locations_start = performance.now();

    let nlocations = load.readUintVlq();
    while (nlocations-- > 0) {
      const id = load.readUintVlq();
      const doc_id = load.readUintVlq();
      const path = load.readUintVlqSeq();

      locations.locations.set(id, new IndexDocLocation(doc_id, path));
    }

    console.log(
      `Loaded ${Intl.NumberFormat().format(
        locations.locations.size
      )} location(s) in ${(performance.now() - locations_start).toFixed(2)} ms`
    );

    return locations;
  }
}
