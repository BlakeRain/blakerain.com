import { Node } from "unist";
import * as mdast from "mdast";
import * as hast from "hast";

const parseAttributes = (str: string): { [key: string]: string } => {
  const attrs: { [key: string]: string } = {};
  const regex = /(\S+)=["']?((?:.(?!["']?\s+(?:\S+)=|[>"']))+.)["']?/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};

// A remark plugin that extracts images that live inside paragraphs, to avoid `<p><img .../></p>`.
export function remarkUnwrapImages() {
  function transformChildren(node: mdast.Parent) {
    node.children = node.children.map((child) =>
      walkNode(child)
    ) as mdast.Content[];
  }

  function walkNode(node: Node): Node {
    switch (node.type) {
      case "root":
        transformChildren(node as mdast.Root);
        break;
      case "paragraph": {
        const paragraph = node as mdast.Paragraph;
        if (
          paragraph.children.length === 1 &&
          paragraph.children[0].type === "image"
        ) {
          return walkNode(paragraph.children[0]);
        } else {
          transformChildren(paragraph);
        }
        break;
      }
    }

    return node;
  }

  return (tree: Node) => {
    return walkNode(tree);
  };
}

// A rehype plugin that wraps code blocks in figures
export function rehypeWrapFigures() {
  function transformChildren(node: hast.Parent) {
    node.children = node.children.map((child) =>
      walkNode(child, node)
    ) as hast.Content[];
  }

  function walkNode(node: Node, parent?: hast.Parent): Node {
    switch (node.type) {
      case "root": {
        transformChildren(node as hast.Root);
        break;
      }

      case "element": {
        const element = node as hast.Element;
        transformChildren(element);

        if (
          element.tagName === "code" &&
          parent &&
          parent.type === "element" &&
          (parent as hast.Element).tagName === "pre"
        ) {
          element.properties = element.properties || {};
          const className = element.properties.className;
          if (typeof className === "string") {
            element.properties.className = ["block", className];
          } else if (className instanceof Array) {
            element.properties.className = ["block", ...className];
          } else {
            element.properties.className = "block";
          }
        } else if (element.tagName === "pre" && element.children.length > 0) {
          const child = element.children[0];
          const child_data = (child.data as any) || {};
          let caption: string | null = null;

          if ("meta" in child_data && typeof child_data["meta"] === "string") {
            const meta = parseAttributes(child_data["meta"]);
            if ("caption" in meta && typeof meta["caption"] === "string") {
              caption = meta["caption"];
            }
          }

          return {
            type: "element",
            tagName: "figure",
            properties: {
              className: "code" + (caption ? " caption" : ""),
            },
            position: element.position,
            children: [
              element,
              ...(caption
                ? [
                    {
                      type: "element",
                      tagName: "ficaption",
                      children: [{ type: "text", value: caption }],
                    },
                  ]
                : []),
            ],
          } as hast.Node;
        } else {
          break;
        }
      }
    }

    return node;
  }

  return (tree: Node) => {
    return walkNode(tree);
  };
}

// A rehype plugin that adds a 'data-path' field to every element indicating it's path (according to seach structure).
export function rehypeAddPaths() {
  function transformChildren(path: number[], node: hast.Parent) {
    node.children = node.children.map((child, index) =>
      walkNode([...path, index], child)
    ) as hast.Content[];
  }

  function walkNode(path: number[], node: Node): Node {
    switch (node.type) {
      case "root":
        transformChildren(path, node as hast.Root);
        break;
      case "element": {
        const element = node as hast.Element;
        if (typeof element.properties === "undefined") {
          element.properties = {};
        }

        element.properties["data-path"] = path.join(",");
        transformChildren(path, element);
      }
    }

    return node;
  }

  return (tree: Node) => {
    return walkNode([], tree);
  };
}
