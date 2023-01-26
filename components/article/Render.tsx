import React, {
  DetailedHTMLProps,
  FC,
  HTMLAttributes,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "../display/Image";

import PreparedIndex, {
  decodePositions,
} from "../../lib/search/index/prepared";
import { Range } from "../../lib/search/tree/node";
import Load from "../../lib/search/encoding/load";

import Bookmark from "./components/Bookmark";
import Quote from "./components/Quote";
import { AnalyticsInformation } from "../Analytics";

import styles from "./Render.module.scss";

// Nodes are generated that include a `path` property that is a string containing a comma-separated list of numbers.
// This is used to number the elements in the document, and is used to perform index operations (like search
// highlighting).
interface PathProps {
  path: number[];
}

// When we're highlighting matching search terms, we want to store the search terms that we've loaded from the
// `PreparedIndex`. An array of this structure is stored in the `LoadedSearchPositionContext`. We refer to this when we
// perform our search highlighting. Each of these objects contains the path to the document element and the set of
// ranges within that element.
interface LoadedSearchPosition {
  path: number[];
  ranges: Range[];
}

const LoadedSearchPositionsContext = React.createContext<
  LoadedSearchPosition[]
>([]);

// Given the array of `LoadedSearchPosition` (usually from the `LoadedSearchPositionsContext`) and the path to the
// current node (usually from `PathProps`), return any highlight ranges in that node.
function getSearchRanges(
  positions: LoadedSearchPosition[],
  path: number[]
): Range[] {
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
        return position.ranges;
      }
    }
  }

  return [];
}

function splitRanges(ranges: Range[], offset: number): Range[] {
  const result: Range[] = [];
  for (const range of ranges) {
    if (range.start < offset) {
      if (range.start + range.length > offset) {
        result.push({
          start: range.start,
          length: offset - range.start,
        });
      }
    } else {
      result.push({
        start: range.start - offset,
        length: range.length,
      });
    }
  }

  return result;
}

// Standard trivial highlighter that takes a set of ranges and a string and returns a React component tree in which the
// text is highlighted using `<mark>` elements at various ranges.
function renderHighlight(ranges: Range[], text: string): React.ReactElement {
  const parts: React.ReactElement[] = [];
  let start_index = 0;

  for (const range of ranges) {
    const prefix = text.substring(start_index, range.start);
    if (prefix.length > 0) {
      parts.push(
        <React.Fragment key={parts.length.toString()}>{prefix}</React.Fragment>
      );
    }

    const highlighted = text.substring(range.start, range.start + range.length);
    if (highlighted.length > 0) {
      parts.push(<mark key={parts.length.toString()}>{highlighted}</mark>);
    }

    start_index = range.start + range.length;
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

// This function examines an anonymous 'props' object to see if it contains a `data-path` property. If so, and the
// property value is a string, then it is split into an array of numbers and returned in a `PathProps` interface.
function expandDataPathProps(props: object): PathProps {
  if (typeof props === "object" && "data-path" in props) {
    return {
      path: ((props as any)["data-path"] as string)
        .split(",")
        .map((n) => parseInt(n, 10)),
    };
  }

  return { path: [] };
}

// Given some phrasing content (similar to a `#text` node), attempt to highlight the contents. This will only perform
// this operation if the `LoadedSearchPositionsContext` actually contains any positions; otherwise it will just return
// the children in a `React.Fragment`.
const RenderPhrasingChildren: FC<React.PropsWithChildren<PathProps>> = ({
  path,
  children,
}) => {
  // If there are no children, then there's nothing to do.
  if (typeof children === "undefined") {
    return null;
  }

  // Get the loaded search highlight positions.
  const positions = useContext(LoadedSearchPositionsContext);

  // If we don't have any positions, just return the children in a fragment.
  if (positions.length === 0) {
    return <>{children}</>;
  }

  // If the `children` is just a string, then use the trivial `renderHighlight` to highlight all the ranges that match
  // the current path (if any). Note that `renderHighlight` will basically do nothing if `getSearchRanges` returns an
  // empty array.
  if (typeof children === "string") {
    return renderHighlight(getSearchRanges(positions, [...path, 0]), children);
  }

  // If the `children` is an array of things, then apply highlighting to all the children.
  if (children instanceof Array) {
    return (
      <>
        {children.map((child, index) => {
          if (typeof child === "string") {
            return (
              <React.Fragment key={index.toString()}>
                {renderHighlight(
                  getSearchRanges(positions, [...path, index]),
                  child
                )}
              </React.Fragment>
            );
          } else {
            // The child is not a string, so it could be a normal react element. In which case we can just leave it
            // as-is: if it's something like a `<em>` element, it will have been replaced with our `RenderEmphasis`
            // component.
            return child;
          }
        })}
      </>
    );
  }

  // We don't know what to do here: `children` is neither a string nor an array.
  return <>{children}</>;
};

// Render an <em> element, but render it's children using `RenderPhrasingChildren`.
const RenderEmphasis: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <em>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </em>
  );
};

// Render a <strong> element, but render it's children using `RenderPhrasingChildren`.
const RenderStrong: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <strong>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </strong>
  );
};

// Render an <li> element, but render it's children using `RenderPhrasingChildren`.
const RenderListItem: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLLIElement>, HTMLLIElement>
) => JSX.Element = ({ children, ...props }) => {
  return (
    <li>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </li>
  );
};

// Render an <a> element, but render it's children using `RenderPhrasingChildren`.
const RenderLink: (
  props: DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <a {...props}>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </a>
  );
};

// Render a <p> element, but render it's children using `RenderPhrasingChildren`.
const RenderParagraph: (
  props: DetailedHTMLProps<
    HTMLAttributes<HTMLParagraphElement>,
    HTMLParagraphElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <p>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </p>
  );
};

// Render a <blockquote> element, but render it's children using `RenderPhrasingChildren`.
const RenderBlockQuote: (
  props: DetailedHTMLProps<
    React.BlockquoteHTMLAttributes<HTMLElement>,
    HTMLElement
  >
) => JSX.Element = ({ children, ...props }) => {
  return (
    <blockquote>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {children}
      </RenderPhrasingChildren>
    </blockquote>
  );
};

// Create a heading at the given level (1..6) that will render a corresponding heading element (e.g. `<h1>`) that uses
// `RenderPhrasingChildren` to render its children.
function createHeading(
  level: number
): (
  props: DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >
) => JSX.Element {
  if (level < 1 || level > 6) {
    throw new Error(`Heading level ${level} is not a valid HTML heading level`);
  }

  return function headingFunction(props) {
    return React.createElement(
      `h${level}`,
      { id: props.id },
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {props.children}
      </RenderPhrasingChildren>
    );
  };
}

// This component is used to override the `<img>` element rendering in MDX, to perform a number of changes:
//
// 1. The entire image is wrapped in a `<figure>` and a `<div>` to handle the image positioning.
// 2. We use the Next `<Image>` element (actually our version of it) to render the image.
// 3. If there is an alt-text for the image, we also render that in a `<figcaption>`.
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

interface HighlightRow {
  properties: any;
  type: "text" | "element";
  tagName?: string;
  value?: string;
  children?: HighlightRow[];
}

function createCodeElement(
  positions: Range[],
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
            {renderHighlight(splitRanges(positions, offset), value)}
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

function getCodeRenderer(positions: Range[]): CodeRenderer {
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

// Somewhat annoyingly, the syntax highlighter we use will always want to encapsulate the code block in a `<pre>`
// element. When we're executing `RenderCodeBlock`, we are _already_ in a `<pre>`, as this was added during hast
// pre-processing.
//
// To avoid nested `<pre>` elements, we can change the element using the `PreTag` property to the syntax highlighter.
// Unfortunately we can't just pass `null` or `undefined`: If we use `null` we'll get an error (quite rightly) from
// `React.createElement` which was called by the syntax highlighter. If we use `undefined` then it's the same as not
// setting the property, and the syntax highlighter will add a `<pre>`.
//
// So, naturally we'd thing to just pass in `React.Fragment`. After all, that's what it is for! Alas this is not going
// to work, as `React.Fragment` will complain (again, quite rightly) that it's being passed a `className` property. As
// it turns out, the syntax highlighter expects to be able to pass a `className` property. This is unfortunate, as the
// type of the `PreTag` property is just `React.ReactNode`, which doesn't tell us about this assumption.
//
// Finally this brings us to `PropIgnoringFragment`, which is just a wrapper around `React.Fragment` that doesn't pass
// any properties. We don't need to acknowledge that the syntax highlighter will pass any properties in our types, as
// the `PropType` property is just a `React.ReactNode`.
const PropIgnoringFragment: FC<React.PropsWithChildren> = ({ children }) => {
  return <>{children}</>;
};

const RenderCodeBlock: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = (props) => {
  const { path } = expandDataPathProps(props);
  const loaded = useContext(LoadedSearchPositionsContext);
  const positions = getSearchRanges(loaded, [...path, 0]);
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
        PreTag={PropIgnoringFragment}
      >
        {content.endsWith("\n")
          ? content.substring(0, content.length - 1)
          : content}
      </SyntaxHighlighter>
    );
  }

  return (
    <code>
      <RenderPhrasingChildren {...expandDataPathProps(props)}>
        {props.children}
      </RenderPhrasingChildren>
    </code>
  );
};

// This component is used to override the `<code>` element in MDX. This component picks the type of transformation to
// perform based on `className` of the `<code>` element:
//
// 1. If the `className` contains `block`, then this is a code block, and we defer the rendering activity to the
//    `RenderCodeBlock` element for special handling.
// 2. Otherwise, we simply render a `<code>` element, but use `RenderPhrasingChildren` to render the contents, which is
//    similar to our overrides for `<em>` or `<strong>`.
const RenderCode: (
  props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
) => JSX.Element = (props) => {
  if (props.className && props.className?.indexOf("block") !== -1) {
    return <RenderCodeBlock {...props} />;
  } else {
    return (
      <code>
        <RenderPhrasingChildren {...expandDataPathProps(props)}>
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
    typeof highlight === "string" ? decodePositions(highlight) : [];
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
              ranges: position.positions,
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
