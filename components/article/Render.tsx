import React, {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "../display/Image";
import styles from "./Render.module.scss";
import { AnalyticsInformation } from "../Analytics";
import PreparedIndex from "../../lib/new_search/index/prepared";
import { Position } from "../../lib/new_search/tree/node";
import Load from "../../lib/new_search/encoding/load";

interface PathProps {
  path: number[];
}

interface LoadedSearchPosition {
  path: number[];
  positions: Position[];
}

const LoadedSearchPositionsContext = React.createContext<
  LoadedSearchPosition[]
>([]);

function getSearchPositions(path: number[]): Position[] {
  const positions = useContext(LoadedSearchPositionsContext);

  for (const position of positions) {
    if (position.path.length === path.length) {
      let match = true;
      for (let i = 0; i < position.path.length; i++) {
        if (position.path[i] !== path[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return position.positions;
      }
    }
  }

  return [];
}

function splitPositions(positions: Position[], offset: number): Position[] {
  const result: Position[] = [];
  for (const position of positions) {
    if (position.start < offset) {
      if (position.start + position.length > offset) {
        result.push({
          start: position.start,
          length: offset - position.start,
        });
      }
    } else {
      result.push({
        start: position.start - offset,
        length: position.length,
      });
    }
  }

  return result;
}

function renderHighlight(
  positions: Position[],
  text: string
): React.ReactElement {
  const parts: React.ReactElement[] = [];
  let start_index = 0;

  for (const position of positions) {
    const prefix = text.substring(start_index, position.start);
    if (prefix.length > 0) {
      parts.push(
        <React.Fragment key={parts.length.toString()}>{prefix}</React.Fragment>
      );
    }

    const highlighted = text.substring(
      position.start,
      position.start + position.length
    );
    if (highlighted.length > 0) {
      parts.push(<mark key={parts.length.toString()}>{highlighted}</mark>);
    }

    start_index = position.start + position.length;
  }

  const suffix = text.substring(start_index);
  if (suffix.length > 0) {
    parts.push(
      <React.Fragment key={parts.length.toString()}>{suffix}</React.Fragment>
    );
  }

  if (parts.length > 0) {
    return <React.Fragment>{parts}</React.Fragment>;
  } else {
    return <React.Fragment>{text}</React.Fragment>;
  }
}

interface PathProps {
  path: number[];
}

function expandDataPath(props: object): PathProps {
  if (typeof props === "object" && "data-path" in props) {
    return {
      path: ((props as any)["data-path"] as string)
        .split(",")
        .map((n) => parseInt(n, 10)),
    };
  }

  return { path: [] };
}

const RenderPhrasingChildren: FC<React.PropsWithChildren<PathProps>> = ({
  path,
  children,
}) => {
  const highlight = useContext(LoadedSearchPositionsContext);
  if (highlight) {
    if (typeof children === "undefined") {
      return null;
    } else if (typeof children === "string") {
      return renderHighlight(getSearchPositions([...path, 0]), children);
    } else if (children instanceof Array) {
      return (
        <>
          {children.map((child, index) => {
            if (typeof child === "string") {
              return (
                <React.Fragment key={index.toString()}>
                  {renderHighlight(getSearchPositions([...path, index]), child)}
                </React.Fragment>
              );
            } else if (
              typeof child === "object" &&
              child.props &&
              child.props.originalType === "inlineCode"
            ) {
              return (
                <code key={index.toString()}>
                  {renderHighlight(
                    getSearchPositions([...path, index]),
                    child.props.children
                  )}
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

const RenderEmphasis: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <em>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </em>
  );
};

const RenderStrong: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <strong>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </strong>
  );
};

const RenderListItem: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <li>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </li>
  );
};

const RenderLink: (
  props: DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <a {...props}>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </a>
  );
};

const RenderParagraph: (
  props: DetailedHTMLProps<
    HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <p>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </p>
  );
};

const RenderBlockQuote: (
  props: DetailedHTMLProps<
    React.BlockquoteHTMLAttributes<HTMLElement>,
    HTMLElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <blockquote>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {children}
      </RenderPhrasingChildren>
    </blockquote>
  );
};

function createHeading(
  level: number
): (
  props: DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => JSX.Element {
  return function headingFunction(props) {
    return React.createElement(
      `h${level}`,
      { id: props.id },
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {props.children}
      </RenderPhrasingChildren>
    );
  };
}

const RenderImage: (
  props: DetailedHTMLProps<
    React.ImgHTMLAttributes<HTMLImageElement>,
    HTMLImageElement
  >
) => JSX.Element = (props) => {
  const caption = props.alt && props.alt !== "" ? props.alt : undefined;

  return (
    <figure className={styles.imageCard}>
      <div className={styles.imageCardImage}>
        <Image
          src={props.src || ""}
          width={
            typeof props.width === "string"
              ? parseInt(props.width)
              : props.width
          }
          height={
            typeof props.height === "string"
              ? parseInt(props.height)
              : props.height
          }
          alt={props.alt || ""}
        />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
};

interface BookmarkProps {
  url: string;
  title: string;
  author: string;
  description: string;
  icon?: string;
  publisher?: string;
  thumbnail?: string;
}

const Bookmark: (props: BookmarkProps) => JSX.Element = ({
  url,
  title,
  author,
  description,
  icon,
  publisher,
  thumbnail,
}) => {
  return (
    <figure className={styles.bookmark}>
      <a className={styles.bookmarkContainer} href={url}>
        <div className={styles.bookmarkContent}>
          <div className={styles.bookmarkTitle}>{title}</div>
          {description && (
            <div className={styles.bookmarkDescription}>{description}</div>
          )}
          <div className={styles.bookmarkMetadata}>
            {icon && (
              <img
                className={styles.bookmarkIcon}
                alt={publisher || undefined}
                src={icon}
              />
            )}
            {publisher && (
              <span className={styles.bookmarkPublisher}>{publisher}</span>
            )}
            {author && <span className={styles.bookmarkAuthor}>{author}</span>}
          </div>
        </div>
        {thumbnail && (
          <div className={styles.bookmarkThumbnail}>
            <img src={thumbnail} alt={title} loading="lazy" decoding="async" />
          </div>
        )}
      </a>
    </figure>
  );
};

interface QuoteProps {
  url?: string;
  author?: string;
}

const Quote: (props: PropsWithChildren<QuoteProps>) => JSX.Element = ({
  url,
  author,
  children,
}) => {
  return (
    <div className={styles.quote}>
      {children}
      {author && (
        <cite className={styles.quoteAuthor}>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {author}
            </a>
          ) : (
            author
          )}
        </cite>
      )}
    </div>
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
  positions: Position[],
  row: HighlightRow,
  index: number,
  offset: number
): { element: React.ReactNode; newOffset: number } {
  let { properties, type, tagName: TagName, value, children } = row;

  if (type === "text") {
    if (positions.length > 0 && value) {
      return {
        element: (
          <React.Fragment key={index.toString()}>
            {renderHighlight(splitPositions(positions, offset), value)}
          </React.Fragment>
        ),
        newOffset: offset + value.length,
      };
    }

    return { element: value, newOffset: offset + (value || "").length };
  }

  if (TagName) {
    let props = {
      ...properties,
      key: index.toString(),
      className: properties.className.join(" "),
    };

    children = children || [];

    const childElements = children.map((child, index) => {
      const { element, newOffset } = createCodeElement(
        positions,
        child,
        index,
        offset
      );
      offset = newOffset;
      return element;
    });

    return {
      element: <TagName {...props}>{childElements}</TagName>,
      newOffset: offset,
    };
  }

  return { element: null, newOffset: offset };
}

type CodeRenderer = (input: {
  rows: HighlightRow[];
  stylesheet: any;
  useInlineStyles: boolean;
}) => React.ReactNode;

function getCodeRenderer(positions: Position[]): CodeRenderer {
  return ({ rows }): React.ReactNode => {
    let offset = 0;
    return rows.map((node, index) => {
      const { element, newOffset } = createCodeElement(
        positions,
        node,
        index,
        offset
      );
      offset = newOffset;
      return element;
    });
  };
}

const LANGUAGE_RE = /language-(\w+)/;

function extractLanguage(className?: string): string | undefined {
  if (typeof className === "string") {
    const match = className.match(LANGUAGE_RE);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

const RenderCodeBlock: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = (props) => {
  const { path } = expandDataPath(props);
  const positions = getSearchPositions([...path, 0]);
  const language = extractLanguage(props.className);
  const [highlighter, setHighlighter] = useState<any>(null);

  useEffect(() => {
    if (language) {
      import("./SyntaxHighlight").then((module) => {
        setHighlighter(module);
      });
    }
  }, [language]);

  if (highlighter && language) {
    const SyntaxHighlighter = highlighter.SyntaxHighlighter;
    const content = props.children as string;

    return (
      <SyntaxHighlighter
        useInlineStyles={false}
        language={language}
        renderer={getCodeRenderer(positions)}
        PreTag={"div"}
      >
        {content.endsWith("\n")
          ? content.substring(0, content.length - 1)
          : content}
      </SyntaxHighlighter>
    );
  }

  return (
    <code>
      <RenderPhrasingChildren {...expandDataPath(props)}>
        {props.children}
      </RenderPhrasingChildren>
    </code>
  );
};

const RenderCode: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = (props) => {
  if (props.className && props.className?.indexOf("block") !== -1) {
    return <RenderCodeBlock {...props} />;
  } else {
    return (
      <code>
        <RenderPhrasingChildren {...expandDataPath(props)}>
          {props.children}
        </RenderPhrasingChildren>
      </code>
    );
  }
};

export const Render: FC<{
  content: MDXRemoteSerializeResult;
  highlight?: string;
}> = ({ content, highlight }) => {
  const components: any = {
    img: RenderImage,
    p: RenderParagraph,
    blockquote: RenderBlockQuote,
    em: RenderEmphasis,
    strong: RenderStrong,
    code: RenderCode,
    li: RenderListItem,
    a: RenderLink,
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),

    Bookmark: Bookmark,
    Quote: Quote,
    AnalyticsInformation: AnalyticsInformation,
  };

  const decoded_positions =
    typeof highlight === "string"
      ? PreparedIndex.decodePositions(highlight)
      : [];
  const [loadedSearchPositions, setLoadedSearchPositions] = useState<
    LoadedSearchPosition[]
  >([]);

  useEffect(() => {
    if (decoded_positions.length === 0) {
      return;
    }

    const abort = new AbortController();
    void (async function () {
      try {
        const res = await fetch("/data/search.bin", {
          signal: abort.signal,
        });

        const index = PreparedIndex.load(new Load(await res.arrayBuffer()));
        const loaded: LoadedSearchPosition[] = [];

        for (const position of decoded_positions) {
          const location = index.locations.getLocation(position.location_id);
          if (location) {
            loaded.push({
              path: location.path,
              positions: position.positions,
            });
          }
        }

        console.log("Loaded search positions", loaded);
        setLoadedSearchPositions(loaded);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        console.error(err);
      }
    })();

    return () => {
      abort.abort();
    };
  }, [highlight || ""]);

  return (
    <LoadedSearchPositionsContext.Provider value={loadedSearchPositions}>
      <MDXRemote {...content} components={components} />
    </LoadedSearchPositionsContext.Provider>
  );
};
