import React, { FC, useContext } from "react";
import cn from "classnames";
import YAML from "yaml";

import { Node } from "unist";
import {
  Code,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  Paragraph,
  Parent,
  Table,
  TableRow,
  Text,
} from "mdast";

import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import styles from "./Document.module.scss";

const HighlightContext = React.createContext<RegExp | null>(null);

function renderHighlight(terms: RegExp, text: string): React.ReactElement {
  let match;
  let parts = [];
  let last = 0;

  while ((match = terms.exec(text)) !== null) {
    const match_end = match.index + match[0].length;

    if (match.index > 0) {
      // Split off the left-half of the string
      parts.push(
        <React.Fragment key={parts.length.toString()}>
          {text.substring(last, match.index)}
        </React.Fragment>
      );
    }

    // Create the highlighted section
    parts.push(
      <mark key={parts.length.toString()}>
        {text.substring(match.index, match_end)}
      </mark>
    );

    // Update our start offset
    last = match_end;
  }

  // If we have any remainder, then add it
  if (last < text.length) {
    parts.push(
      <React.Fragment key={parts.length.toString()}>
        {text.substring(last)}
      </React.Fragment>
    );
  }

  // If we ended up matching something, then we can return the compound; otherwise just return the text
  if (parts.length > 0) {
    return <React.Fragment>{parts}</React.Fragment>;
  } else {
    return <React.Fragment>{text}</React.Fragment>;
  }
}

const RenderChildren: FC<{ node: Parent }> = ({ node }) => {
  return (
    <React.Fragment>
      {node.children.map((child, index) => (
        <RenderNode key={index.toString()} node={child} />
      ))}
    </React.Fragment>
  );
};

const RenderText: FC<{ node: Text }> = ({ node }) => {
  const highlight = useContext(HighlightContext);
  if (highlight) {
    return renderHighlight(highlight, node.value);
  }

  return <React.Fragment>{(node as Text).value}</React.Fragment>;
};

const RenderInlineCode: FC<{ node: InlineCode }> = ({ node }) => {
  const highlight = useContext(HighlightContext);
  if (highlight) {
    return <code>{renderHighlight(highlight, node.value)}</code>;
  }

  return <code>{node.value}</code>;
};

const RenderParagraph: FC<{ node: Paragraph }> = ({ node }) => {
  // Handle a special-case where an image is in a paragraph on it's own
  if (node.children.length === 1 && node.children[0].type === "image") {
    return <RenderImage node={node.children[0] as Image} />;
  }

  return (
    <p>
      <RenderChildren node={node} />
    </p>
  );
};

const RenderHeading: FC<{ node: Heading }> = ({ node }) => {
  return React.createElement(
    `h${node.depth}`,
    null,
    <RenderChildren node={node} />
  );
};

const RenderTableRow: FC<{ node: TableRow; head?: boolean }> = ({
  node,
  head,
}) => {
  return (
    <tr>
      {node.children.map((cell, index) =>
        React.createElement(
          head ? "th" : "td",
          { key: index.toString() },
          <RenderChildren node={cell} />
        )
      )}
    </tr>
  );
};

const RenderTable: FC<{ node: Table }> = ({ node }) => {
  const [head_row, ...rows] = node.children;

  const head = (
    <thead>
      <RenderTableRow node={head_row as TableRow} head />
    </thead>
  );

  const body = (
    <tbody>
      {rows.map((row, index) => (
        <RenderTableRow key={index.toString()} node={row as TableRow} />
      ))}
    </tbody>
  );

  return (
    <table>
      {head}
      {body}
    </table>
  );
};

const RenderList: FC<{ node: List }> = ({ node }) => {
  const attrs = { start: node.start };
  return React.createElement(
    node.ordered ? "ol" : "ul",
    attrs,
    <RenderChildren node={node} />
  );
};

const RenderLink: FC<{ node: Link }> = ({ node }) => {
  return (
    <a href={node.url} title={node.title || undefined}>
      <RenderChildren node={node} />
    </a>
  );
};

const RenderImage: FC<{ node: Image }> = ({ node }) => {
  const query_index = node.url.indexOf("?");
  const params = new URLSearchParams(
    query_index === -1
      ? undefined
      : new URLSearchParams(node.url.substr(query_index))
  );
  const wide = Boolean(params.get("wide"));
  const full = Boolean(params.get("full"));
  const width = params.get("width");
  const height = params.get("height");
  const caption = params.get("caption");

  return (
    <figure
      className={cn(styles.imageCard, {
        [styles.imageCardWide]: wide,
        [styles.imageCardFull]: full,
        [styles.imageCardWithCaption]: Boolean(caption),
      })}
    >
      <img
        loading="lazy"
        width={width || undefined}
        height={height || undefined}
        src={node.url}
      />
      {caption && <figcaption dangerouslySetInnerHTML={{ __html: caption }} />}
    </figure>
  );
};

interface BookmarkProps {
  url: string;
  metadata: {
    url: string;
    title: string;
    author: string;
    description: string;
    icon: string;
    publisher: string;
    thumbnail: string;
  };
}

const RenderBookmark: FC<{ node: Code }> = ({ node }) => {
  const { url, metadata } = YAML.parse(node.value) as BookmarkProps;

  return (
    <figure className={styles.bookmark}>
      <a className={styles.bookmarkContainer} href={url}>
        <div className={styles.bookmarkContent}>
          <div className={styles.bookmarkTitle}>{metadata.title}</div>
          <div className={styles.bookmarkDescription}>
            {metadata.description}
          </div>
          <div className={styles.bookmarkMetadata}>
            <img className={styles.bookmarkIcon} src={metadata.icon} />
            <span className={styles.bookmarkPublisher}>
              {metadata.publisher}
            </span>
            <span className={styles.bookmarkAuthor}>{metadata.author}</span>
          </div>
        </div>
        <div className={styles.bookmarkThumbnail}>
          <img src={metadata.thumbnail} />
        </div>
      </a>
    </figure>
  );
};

const RenderCode: FC<{ node: Code }> = ({ node }) => {
  const meta = typeof node.meta === "string" ? JSON.parse(node.meta) : {};
  const caption = meta["caption"];
  const highlight =
    typeof node.lang === "string" && node.lang !== "box-drawing";

  return (
    <figure
      className={cn(styles.codeCard, {
        [styles.codeCardWithCaption]: Boolean(caption),
      })}
    >
      {highlight ? (
        <SyntaxHighlighter
          useInlineStyles={false}
          language={node.lang || undefined}
        >
          {node.value}
        </SyntaxHighlighter>
      ) : (
        <pre>
          <code>{node.value}</code>
        </pre>
      )}
      {caption && <figcaption dangerouslySetInnerHTML={{ __html: caption }} />}
    </figure>
  );
};

export const RenderNode: FC<{ node: Node }> = ({ node }) => {
  switch (node.type) {
    case "root":
      return <RenderChildren node={node as Parent} />;
    case "text":
      return <RenderText node={node as Text} />;
    case "paragraph":
      return <RenderParagraph node={node as Paragraph} />;
    case "heading":
      return <RenderHeading node={node as Heading} />;
    case "table":
      return <RenderTable node={node as Table} />;
    case "list":
      return <RenderList node={node as List} />;
    case "link":
      return <RenderLink node={node as Link} />;
    case "image":
      return <RenderImage node={node as Image} />;
    case "code":
      switch ((node as Code).lang) {
        case "bookmark":
          return <RenderBookmark node={node as Code} />;
        case "raw_html":
          return (
            <div dangerouslySetInnerHTML={{ __html: (node as Code).value }} />
          );
        default:
          return <RenderCode node={node as Code} />;
      }

    case "listItem":
      return (
        <li>
          <RenderChildren node={node as Parent} />
        </li>
      );

    case "inlineCode":
      return <RenderInlineCode node={node as InlineCode} />;
    case "emphasis":
      return (
        <em>
          <RenderChildren node={node as Parent} />
        </em>
      );
    case "strong":
      return (
        <strong>
          <RenderChildren node={node as Parent} />
        </strong>
      );
    case "blockquote":
      return (
        <blockquote>
          <RenderChildren node={node as Parent} />
        </blockquote>
      );

    default:
      console.warn(`Unrecognized node type: '${node.type}'`);

      return null;
  }
};

export const Render: FC<{ node: Node; highlight?: string[] }> = ({
  node,
  highlight,
}) => {
  const highlight_regex =
    typeof highlight !== "undefined" && highlight.length > 0
      ? new RegExp(highlight.join("|"), "mig")
      : null;

  return (
    <HighlightContext.Provider value={highlight_regex}>
      <RenderNode node={node} />
    </HighlightContext.Provider>
  );
};
