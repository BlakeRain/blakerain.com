import React, { FC, useContext } from "react";
import cn from "classnames";
import YAML from "yaml";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
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

const RenderPhrasingChildren: FC = ({ children }) => {
  const highlight = useContext(HighlightContext);
  if (highlight) {
    if (typeof children === "undefined") {
      return null;
    } else if (typeof children === "string") {
      return renderHighlight(highlight, children);
    } else if (children instanceof Array) {
      return (
        <>
          {children.map((child, index) => {
            if (typeof child === "string") {
              return (
                <React.Fragment key={index.toString()}>
                  {renderHighlight(highlight, child)}
                </React.Fragment>
              );
            } else if (
              typeof child === "object" &&
              child.props &&
              child.props.originalType === "inlineCode"
            ) {
              return (
                <code key={index.toString()}>
                  {renderHighlight(highlight, child.props.children)}
                </code>
              );
            } else {
              return child;
            }
          })}
        </>
      );
    } else {
      return <>{children}</>;
    }
  } else {
    return <>{children}</>;
  }
};

const RenderEmphasis: FC = ({ children }) => {
  return (
    <em>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </em>
  );
};

const RenderStrong: FC = ({ children }) => {
  return (
    <em>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </em>
  );
};

const RenderListItem: FC = ({ children }) => {
  return (
    <li>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </li>
  );
};

const RenderLink: FC<{ href: string }> = ({ href, children }) => {
  return (
    <a href={href}>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </a>
  );
};

const RenderParagraph: FC = ({ children }) => {
  return (
    <p>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </p>
  );
};

const RenderBlockQuote: FC = ({ children }) => {
  return (
    <blockquote>
      <RenderPhrasingChildren>{children}</RenderPhrasingChildren>
    </blockquote>
  );
};

function createHeading(level: number): FC {
  return function headingFunction(props) {
    return React.createElement(
      `h${level}`,
      null,
      <RenderPhrasingChildren>{props.children}</RenderPhrasingChildren>
    );
  };
}

const RenderImage: FC<{ src: string }> = (props) => {
  const query_index = props.src.indexOf("?");
  const params = new URLSearchParams(
    query_index === -1 ? undefined : props.src.substring(query_index)
  );
  const width = params.get("width");
  const height = params.get("height");
  const caption = params.get("caption");
  const wide = Boolean(params.get("wide"));
  const full = Boolean(params.get("full"));

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
        src={props.src}
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

const RenderBookmark: FC = (props) => {
  const { url, metadata } = YAML.parse(
    props.children as string
  ) as BookmarkProps;

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

interface HighlightRow {
  properties: any;
  type: "text" | "element";
  tagName?: string;
  value?: string;
  children?: HighlightRow[];
}

function createCodeElement(
  highlight: RegExp | null,
  { properties, type, tagName: TagName, value, children }: HighlightRow,
  index: number
): React.ReactNode {
  if (type === "text") {
    if (highlight && value) {
      return (
        <React.Fragment key={index.toString()}>
          {renderHighlight(highlight, value)}
        </React.Fragment>
      );
    }

    return value;
  }

  if (TagName) {
    let props = {
      ...properties,
      key: index.toString(),
      className: properties.className.join(" "),
    };

    return (
      <TagName {...props}>
        {(children || []).map((child, index) =>
          createCodeElement(highlight, child, index)
        )}
      </TagName>
    );
  }

  return null;
}

type CodeRenderer = (input: {
  rows: HighlightRow[];
  stylesheet: any;
  useInlineStyles: boolean;
}) => React.ReactNode;

function getCodeRenderer(search: RegExp | null): CodeRenderer {
  return ({ rows }): React.ReactNode => {
    return rows.map((node, index) => createCodeElement(search, node, index));
  };
}

const RenderCode: FC<{ className: string; metastring?: string }> = (props) => {
  const highlight = useContext(HighlightContext);
  const meta =
    typeof props.metastring === "string" ? JSON.parse(props.metastring) : {};
  const caption = meta["caption"];
  const syntax =
    typeof props.className === "string" &&
    props.className !== "language-box-drawing";
  const content = props.children as string;

  return (
    <figure
      className={cn(styles.codeCard, {
        [styles.codeCardWithCaption]: Boolean(caption),
      })}
    >
      {syntax ? (
        <SyntaxHighlighter
          useInlineStyles={false}
          showLineNumbers={true}
          language={props.className.replace("language-", "") || undefined}
          renderer={getCodeRenderer(highlight)}
        >
          {content.endsWith("\n")
            ? content.substring(0, content.length - 1)
            : content}
        </SyntaxHighlighter>
      ) : (
        <pre>
          <code>{props.children}</code>
        </pre>
      )}
      {caption && <figcaption dangerouslySetInnerHTML={{ __html: caption }} />}
    </figure>
  );
};

const SelectCodeBlock: FC<{ className: string }> = (props) => {
  switch (props.className) {
    case "language-bookmark":
      return <RenderBookmark {...props} />;
    case "language-raw_html":
      return (
        <div dangerouslySetInnerHTML={{ __html: props.children as string }} />
      );
    default:
      return <RenderCode {...props} />;
  }
};

const SelectPre: FC = (props) => {
  return <>{props.children}</>;
};

export const Render: FC<{
  content: MDXRemoteSerializeResult;
  highlight?: string[];
}> = ({ content, highlight }) => {
  const highlight_regex =
    typeof highlight !== "undefined" && highlight.length > 0
      ? new RegExp(highlight.join("|"), "mig")
      : null;

  return (
    <HighlightContext.Provider value={highlight_regex}>
      {" "}
      <MDXRemote
        {...content}
        components={{
          code: SelectCodeBlock,
          pre: SelectPre,
          img: RenderImage,
          p: RenderParagraph,
          blockquote: RenderBlockQuote,
          em: RenderEmphasis,
          strong: RenderStrong,
          li: RenderListItem,
          a: RenderLink,
          h1: createHeading(1),
          h2: createHeading(2),
          h3: createHeading(3),
          h4: createHeading(4),
          h5: createHeading(5),
          h6: createHeading(6),
        }}
      />
    </HighlightContext.Provider>
  );
};
