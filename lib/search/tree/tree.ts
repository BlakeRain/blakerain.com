import Load from "../encoding/load";
import Store from "../encoding/store";
import TreeNode, { Range } from "./node";

function getCommonPrefix(left: string, right: string): string {
  let prefix = "";

  for (let i = 0; i < Math.min(left.length, right.length); ++i) {
    if (left[i] === right[i]) {
      prefix += left[i];
    } else {
      break;
    }
  }

  return prefix;
}

export default class Tree {
  public root: TreeNode;

  constructor(root?: TreeNode) {
    this.root = root || new TreeNode();
  }

  public insert(text: string, location_id: number, range: Range) {
    let node = this.root;

    for (let i = 0; i < text.length; ) {
      const ch = text.charCodeAt(i);
      const remainder = text.substring(i);
      let child = node.children.get(ch);

      if (child) {
        // If the child's fragment and the remainder of 'text' are the same, then this is our node we want to change.
        if (child.fragment === remainder) {
          child.addRange(location_id, range);
          return;
        }

        // Get the common prefix of the child's fragment and the remainder of 'text'.
        const prefix = getCommonPrefix(child.fragment, remainder);

        if (prefix.length < child.fragment.length) {
          let mid: TreeNode | null = null;

          if (prefix.length === text.length - i) {
            mid = new TreeNode(remainder);
            mid.addRange(location_id, range);
          } else if (prefix.length < text.length - i) {
            mid = new TreeNode(prefix);

            const tail = new TreeNode(remainder.substring(prefix.length));
            tail.addRange(location_id, range);
            mid.children.set(tail.fragment.charCodeAt(0), tail);
          }

          if (mid !== null) {
            // Set the 'child' node to be a child of the new 'mid' node
            mid.children.set(child.fragment.charCodeAt(prefix.length), child);

            // Update the fragment of 'child' to be what's left of the fragment.
            child.fragment = child.fragment.substring(prefix.length);

            // Replace 'child' with 'mid' in 'node'
            node.children.set(ch, mid);

            return;
          }
        }

        i += child.fragment.length;
        node = child;
      } else {
        child = new TreeNode(text.substring(i));
        child.addRange(location_id, range);
        node.children.set(ch, child);
        return;
      }
    }
  }

  public search(prefix: string): Map<number, Range[]> {
    let node = this.root;

    for (let i = 0; i < prefix.length; ) {
      const ch = prefix.charCodeAt(i);
      let child = node.children.get(ch);

      if (child) {
        // Get the common prefix between the remainder of the prefix and the child's fragment.
        const common_prefix = getCommonPrefix(
          child.fragment,
          prefix.substring(i)
        );

        // If the common prefix doesn't match the fragment or what's left of the prefix, this prefix cannot be found in
        // the tree.
        if (
          common_prefix.length !== child.fragment.length &&
          common_prefix.length !== prefix.length - i
        ) {
          return new Map();
        }

        i += child.fragment.length;
        node = child;
      } else {
        // No child exists with this character, so the prefix cannot be found in the tree.
        return new Map();
      }
    }

    const found_ranges: Map<number, Range[]> = new Map();

    // Collect up all the ranges of the tree nodes from 'node'.
    function collect(node: TreeNode) {
      if (node.ranges.size > 0) {
        for (const [location_id, ranges] of node.ranges) {
          let result_ranges = found_ranges.get(location_id);
          found_ranges.set(
            location_id,
            result_ranges ? [...result_ranges, ...ranges] : ranges
          );
        }
      }

      for (const child of node.children.values()) {
        collect(child);
      }
    }

    collect(node);
    return found_ranges;
  }

  public store(store: Store) {
    let nodeCount = 0;
    let maxDepth = 0;

    // Prepare a variable to store our stack depth and a function that will write the stack depth to the store. This
    // instruction is used to tell our decoder how far back we want to pop the construction stack to get back to our
    // parent.
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

      // We have finished this node, so increment our stack depth and node count.
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
      // Decode the tree node from the buffer.
      const { key, hasChildren, node } = TreeNode.load(load);
      ++total;

      // If there is a node on the top of the stack, then add this node as a child.
      if (stack.length > 0) {
        stack[stack.length - 1].children.set(key, node);
      }

      // Push this node onto the stack, and if there's no root node yet, then this is the root node.
      stack.push(node);
      if (!root) {
        root = node;
      }

      // If we don't have any children, then read the number of stack elements to pop to get back to the correct parent
      // node. This value was previously written by 'retrace'. If we end up with an empty stack then we've reached the
      // end of the tree.
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
