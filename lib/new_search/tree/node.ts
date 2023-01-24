import Load from "../encoding/load";
import Store from "../encoding/store";

export interface Position {
  start: number;
  length: number;
}

/// A node in the search tree
///
/// Each node in the search tree contains a set of zero or more children, where each child is indexed by character. Each
/// node also contains zero or more records.
export default class TreeNode {
  public children: Map<number, TreeNode> = new Map();
  public positions: Map<number, Position[]> = new Map();

  public addPosition(location_id: number, position: Position) {
    let positions = this.positions.get(location_id);
    if (positions) {
      positions.push(position);
    } else {
      this.positions.set(location_id, [position]);
    }
  }

  public store(store: Store, key: number) {
    const tag =
      (key << 2) |
      (this.positions.size > 0 ? 0x02 : 0x00) |
      (this.children.size > 0 ? 0x01 : 0x00);

    store.writeUintVlq(tag);
    if (this.positions.size > 0) {
      store.writeUintVlq(this.positions.size);
      for (const [location_id, positions] of this.positions) {
        store.writeUintVlq(location_id);
        store.writeUintVlq(positions.length);
        for (const position of positions) {
          store.writeUintVlq(position.start);
          store.writeUintVlq(position.length);
        }
      }
    }
  }

  public static load(load: Load): {
    key: number;
    hasChildren: boolean;
    node: TreeNode;
  } {
    const tag = load.readUintVlq();
    const node = new TreeNode();

    if ((tag & 0x02) === 0x02) {
      let nlocations = load.readUintVlq();
      while (nlocations-- > 0) {
        const location_id = load.readUintVlq();
        const positions: Position[] = [];

        let npositions = load.readUintVlq();
        while (npositions-- > 0) {
          const start = load.readUintVlq();
          const length = load.readUintVlq();
          positions.push({ start, length });
        }

        node.positions.set(location_id, positions);
      }
    }

    return {
      key: tag >> 2,
      hasChildren: (tag & 1) !== 0,
      node,
    };
  }
}
