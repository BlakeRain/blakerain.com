import { Element, Node, Root, Text } from "hast";
import { tokenizePhrasing } from "../index/tokens";

export interface StructParent {
  children: StructNode[];
}

export interface StructElement extends StructParent {
  type: "element";
  tagName: string;
}

export interface StructText {
  type: "text";
  content: string | null;
}

export type StructNode = StructElement | StructText;

export function fromHast(root: Root): StructNode[] {
  function fromHastNode(node: Node): StructNode | null {
    switch (node.type) {
      case "text":
        return {
          type: "text",
          content: (node as Text).value,
        };
      case "element":
        return {
          type: "element",
          tagName: (node as Element).tagName,
          children: fromHastNodes((node as Element).children),
        };
      default:
        return null;
    }
  }

  function fromHastNodes(nodes: Node[]): StructNode[] {
    const result: StructNode[] = [];

    for (const node of nodes) {
      const structNode = fromHastNode(node);
      if (structNode) {
        result.push(applyModification(structNode));
      }
    }

    return result;
  }

  function applyModification(node: StructNode): StructNode {
    if (node.type === "element") {
      for (let i = 0; i < node.children.length; ++i) {
        node.children[i] = applyModification(node.children[i]);
      }

      if (node.tagName === "img") {
        // All <img> nodes are wrapped in a <figure>
        return {
          type: "element",
          tagName: "figure",
          children: [node],
        };
      }
    }

    return node;
  }

  return fromHastNodes(root.children);
}

export function printOutline(root: StructNode[]) {
  function printNode(node: StructNode, depth: number, prefix: number[]) {
    const indent = " ".repeat(depth * 2);

    if (node.type === "element") {
      console.log(`${indent}<${node.tagName}> (${prefix.join(",")})`);
      let child_index = 0;
      for (const child of node.children) {
        printNode(child, 1 + depth, [...prefix, child_index++]);
      }
      console.log(`${indent}</${node.tagName}>`);
    } else if (node.type === "text") {
      console.log(
        `${indent}#text: ${tokenizePhrasing(node.content || "")
          .map((token) => token.text)
          .join(" ")}`
      );
    }
  }

  let node_index = 0;
  for (const node of root) {
    printNode(node, 0, [node_index++]);
  }
}

export interface WalkStructItem {
  path: number[];
  tagName: string;
  content: string;
}

export function* walkStruct(root: StructNode[]): Generator<WalkStructItem> {
  let path: number[] = [];
  let index: number = 0;
  let nodes: StructNode[] = [...root];
  let tagName: string = "";
  let stack: { tagName: string; nodes: StructNode[] }[] = [];

  for (;;) {
    while (nodes.length > 0) {
      const node = nodes.shift()!;

      if (node.type === "text" && typeof node.content === "string") {
        yield { path: [...path, index], tagName, content: node.content };
        index += 1;
      } else if (node.type === "element") {
        path.push(index);
        stack.push({ tagName, nodes });

        nodes = [...node.children];
        index = 0;
        tagName = node.tagName;
      }
    }

    if (stack.length === 0) {
      break;
    }

    const top = stack.pop()!;
    nodes = top.nodes;
    tagName = top.tagName;
    index = path.pop()! + 1;
  }
}
