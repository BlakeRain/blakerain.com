import Load from "../encoding/load";
import Store from "../encoding/store";
import TreeNode, { Range } from "./node";

export default class Tree {
  public root: TreeNode;

  constructor(root?: TreeNode) {
    this.root = root || new TreeNode();
  }

  public insert(text: string, location_id: number, position: Range) {
    const term_chars = new TextEncoder().encode(text);
    let node = this.root;

    for (const term_char of term_chars) {
      let child = node.children.get(term_char);
      if (!child) {
        child = new TreeNode();
        node.children.set(term_char, child);
      }

      node = child;
    }

    node.addPosition(location_id, position);
  }

  public search(term: string): Map<number, Range[]> {
    let node = this.root;

    for (let code of new TextEncoder().encode(term)) {
      const child = node.children.get(code);
      if (!child) {
        return new Map();
      }

      node = child;
    }

    if (!node) {
      return new Map();
    }

    // The collected results, indexed by the location
    const found_locations: Map<number, Range[]> = new Map();

    function collectRecords(node: TreeNode) {
      if (node.positions.size > 0) {
        for (const [location_id, positions] of node.positions) {
          let result_positions = found_locations.get(location_id);
          found_locations.set(
            location_id,
            result_positions ? [...result_positions, ...positions] : positions
          );
        }
      }

      for (const child of node.children.values()) {
        collectRecords(child);
      }
    }

    collectRecords(node);

    return found_locations;
  }

  public store(store: Store) {
    let nodeCount = 0;
    let maxDepth = 0;

    let stackDepth = 0;
    function retrace() {
      if (stackDepth > 0) {
        store.writeUintVlq(stackDepth);
        maxDepth = Math.max(maxDepth, stackDepth);
        stackDepth = 0;
      }
    }

    function encodeNode(key: number, node: TreeNode) {
      // Retrate our steps back to the parent node
      retrace();

      // Store the tree node, and if the node has children, recursively store those aswell.
      node.store(store, key);
      for (const [child_key, child] of node.children) {
        encodeNode(child_key, child);
      }

      // We have finished this node, so increment our stack depth.
      stackDepth++;
      nodeCount++;
    }

    encodeNode(0, this.root);
    retrace();

    console.log(
      `Index tree contained ${nodeCount} nodes, max depth of ${maxDepth}`
    );
  }

  public static load(load: Load): Tree {
    let start = performance.now();
    let stack: TreeNode[] = [];
    let root: TreeNode | null = null;
    let total = 0;

    for (;;) {
      const { key, hasChildren, node } = TreeNode.load(load);
      ++total;

      if (stack.length > 0) {
        stack[stack.length - 1].children.set(key, node);
      }

      stack.push(node);
      if (!root) {
        root = node;
      }

      if (!hasChildren) {
        let depth = load.readUintVlq();
        while (depth-- > 0) {
          stack.pop();
        }

        if (stack.length === 0) {
          break;
        }
      }
    }

    console.log(
      `Loaded ${Intl.NumberFormat().format(total)} tree node(s) in ${(
        performance.now() - start
      ).toFixed(2)} ms`
    );

    return new Tree(root);
  }
}
