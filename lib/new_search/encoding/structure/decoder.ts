import { StructNode } from "../../document/structure";
import Load from "../load";

const TAG_ELEMENT = 0x01;
const TAG_TEXT = 0x02;

export default function decode(load: Load): StructNode[] {
  const names: Map<number, string> = new Map();
  names.set(0, "");

  // Decode the tag names from the buffer.
  let num_tags = load.readUintVlq();
  while (num_tags-- > 0) {
    const tag_id = load.readUintVlq();
    const tag_name = load.readUtf8();
    names.set(tag_id, tag_name);
  }

  function decodeNode(): StructNode {
    let stack: StructNode[] = [];
    let root: StructNode | null = null;

    for (;;) {
      // Decode the tag from the buffer.
      const tag = load.readUintVlq();

      var node: StructNode;
      switch ((tag & 0x06) >> 1) {
        case TAG_TEXT:
          node = { type: "text", content: null };
          break;

        case TAG_ELEMENT:
          node = {
            type: "element",
            tagName: names.get(tag >> 3)!,
            children: [],
          };
          break;

        default:
          console.error(
            `Problem decoding structure: unrecognized node kind ${
              (tag & 0x06) >> 1
            }`
          );
          return { type: "text", content: "<invalid encoding>" };
      }

      if (!root) {
        root = node;
      }

      // If we have a node on the top of the stack, then add this node as a child.
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        if (top.type === "element") {
          top.children.push(node);
        } else {
          console.error(
            `Problem decoding structure: "text" node cannot have children`
          );
          return { type: "text", content: "<invalid encoding>" };
        }
      }

      // Push this element onto the stack.
      stack.push(node);

      // If we don't have any children (indicated by the lowest bit of the tag), then this is a leaf element and we
      // want to pop the stack to get back to the correct parent node. The depth of the stack we want to pop is
      // encoded in the stream.
      if ((tag & 0x01) === 0x00) {
        var depth = load.readUintVlq();
        while (depth-- > 0) {
          stack.pop();
        }

        // If we came to the end of the stack, then we're done decoding this node.
        if (stack.length === 0) {
          return root;
        }
      }
    }
  }

  // Get the number of root nodes there were, and then decode them.
  let num_root_nodes = load.readUintVlq();
  const root_nodes: StructNode[] = [];
  while (num_root_nodes-- > 0) {
    root_nodes.push(decodeNode());
  }

  return root_nodes;
}
