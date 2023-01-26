import { promises as fs } from "fs";
import TreeNode from "./node";
import Tree from "./tree";

export async function writeTreeDigraph(path: string, tree: Tree) {
  const lines: string[] = ["digraph {"];
  let node_index = 0;

  function walk(node: TreeNode): number {
    let node_id = node_index++;
    lines.push(`  node${node_id} [label=${JSON.stringify(node.fragment)}];`);
    for (const [ch, child] of node.children) {
      const child_id = walk(child);
      lines.push(
        `  node${node_id} -> node${child_id} [label=${JSON.stringify(
          String.fromCharCode(ch)
        )}];`
      );
    }

    return node_id;
  }

  for (const node of tree.root.children.values()) {
    walk(node);
  }

  lines.push("}");
  await fs.writeFile(path, lines.join("\n"), "utf-8");
}
