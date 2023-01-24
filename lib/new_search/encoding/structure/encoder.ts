import { StructNode } from "../../document/structure";
import Store from "../store";

const TAG_ELEMENT = 0x01;
const TAG_TEXT = 0x02;

export default function encoder(store: Store, structure: StructNode[]) {
  const names: Map<string, number> = new Map();
  let num_names = 1;
  names.set("", 0);

  function gatherNames(node: StructNode) {
    if (node.type === "element") {
      const tagName = node.tagName;
      if (!names.has(tagName)) {
        names.set(tagName, num_names++);
      }

      for (const child of node.children) {
        gatherNames(child);
      }
    }
  }

  let stackDepth = 0;
  function retrace() {
    if (stackDepth > 0) {
      store.writeUintVlq(stackDepth);
      stackDepth = 0;
    }
  }

  function encodeNode(node: StructNode) {
    var tag: number;
    var children: StructNode[] = [];

    switch (node.type) {
      case "text":
        tag = TAG_TEXT << 1;
        break;
      case "element":
        tag = (TAG_ELEMENT << 1) | (names.get(node.tagName)! << 3);
        children = node.children;
        break;
      default:
        return;
    }

    // Retrace our steps back to the parent node
    retrace();

    // Set the first bit in the stored tag if we have any children.
    if (children.length > 0) {
      tag |= 0x01;
    }

    // Store the tag for this node.
    store.writeUintVlq(tag);

    // If we have any children, then encode them
    for (const child of children) {
      encodeNode(child);
    }

    // We have finished in this node, so increment our stack depth.
    stackDepth++;
  }

  // Gather up all the names of the elements in the document structure, and assign them a unique ID.
  for (const node of structure) {
    gatherNames(node);
  }

  // Write out the dictionary of names as a mapping from each unique ID to the name.
  store.writeUintVlq(names.size);
  for (const [tagName, tagId] of names) {
    store.writeUintVlq(tagId);
    store.writeUtf8(tagName);
  }

  // Encode how many root nodes there are, and then encode each node.
  store.writeUintVlq(structure.length);
  for (const node of structure) {
    encodeNode(node);
    retrace();
  }
}
