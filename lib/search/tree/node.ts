import Load from "../encoding/load";
import Store from "../encoding/store";

export interface Range {
  start: number;
  length: number;
}

export function mergeRanges(as: Range[], bs: Range[]) {
  for (const b of bs) {
    const b_start = b.start;
    const b_end = b.start + b.length;

    let inserted = false;
    for (let i = 0; i < as.length; ++i) {
      const a_start = as[i].start;
      const a_end = a_start + as[i].length;

      if (a_end < b_start) {
        continue;
      }

      if (a_start > b_end) {
        inserted = true;
        as.splice(i, 0, b);
        break;
      }

      as[i].start = Math.min(a_start, b_start);
      const end = Math.max(a_end, b_end);
      as[i].length = end - as[i].start;
      inserted = true;
      break;
    }

    if (!inserted) {
      as.push(b);
    }
  }
}

/// A node in the search tree
///
/// Each node in the search tree contains a set of zero or more children, where each child is indexed by character. Each
/// node also contains a mapping from a location ID to an array of one or more ranges.
export default class TreeNode {
  public fragment: string;
  public children: Map<number, TreeNode> = new Map();
  public ranges: Map<number, Range[]> = new Map();

  constructor(fragment: string = "") {
    this.fragment = fragment;
  }

  public addRange(location_id: number, position: Range) {
    let ranges = this.ranges.get(location_id);
    if (ranges) {
      ranges.push(position);
    } else {
      this.ranges.set(location_id, [position]);
    }
  }

  public store(store: Store, key: number) {
    const tag =
      (key << 2) |
      (this.ranges.size > 0 ? 0x02 : 0x00) |
      (this.children.size > 0 ? 0x01 : 0x00);

    store.writeUintVlq(tag);
    store.writeUtf8(this.fragment);
    if (this.ranges.size > 0) {
      store.writeUintVlq(this.ranges.size);
      for (const [location_id, positions] of this.ranges) {
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
    const fragment = load.readUtf8();
    const node = new TreeNode(fragment);

    if ((tag & 0x02) === 0x02) {
      let nlocations = load.readUintVlq();
      while (nlocations-- > 0) {
        const location_id = load.readUintVlq();
        const positions: Range[] = [];

        let npositions = load.readUintVlq();
        while (npositions-- > 0) {
          const start = load.readUintVlq();
          const length = load.readUintVlq();
          positions.push({ start, length });
        }

        node.ranges.set(location_id, positions);
      }
    }

    return {
      key: tag >> 2,
      hasChildren: (tag & 1) !== 0,
      node,
    };
  }
}
