import React, { FC, useContext } from "react";
import cn from "classnames";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { LightAsync as SyntaxHighlighter } from "react-syntax-highlighter";

import {
  AtomMarker,
  Marker,
  MobileDoc,
  Section,
  MarkupSection,
  ImageSection,
  ListSection,
  CardSection,
  TextMarker,
  emptyMobileDoc,
  Markup,
} from "../lib/mobiledoc";

import styles from "./Document.module.scss";

type StackItemAttributes = { [key: string]: string };

interface StackItem {
  tag: string;
  attributes: StackItemAttributes;
  children: React.ReactElement[];
}

function getMarkupAttributes(markup: Markup): StackItemAttributes {
  const attr_list = markup[1] || [];
  const attributes: StackItemAttributes = {};

  for (let i = 0; i < attr_list.length; i += 2) {
    attributes[attr_list[i]] = attr_list[i + 1];
  }

  return attributes;
}

function stackItemFromMarkup(markup: Markup): StackItem {
  return {
    tag: markup[0],
    attributes: getMarkupAttributes(markup),
    children: [],
  };
}

function popStackItems(
  stack: StackItem[],
  count: number
): React.ReactElement | null {
  var element = null;

  while (count-- > 0) {
    const top = stack.pop();

    if (!top) {
      console.error(`Attempt to pop empty render stack`);
      return null;
    }

    const next = stack.length > 0 ? stack[stack.length - 1] : null;

    element = React.createElement(
      top.tag,
      { key: next ? next.children.length.toString() : "", ...top.attributes },
      top.children
    );

    if (next) {
      next.children.push(element);
      element = null;
    }
  }

  return element;
}

interface MobileDocContextValue {
  doc: MobileDoc;
  stack: StackItem[];
}

const MobileDocContext = React.createContext<MobileDocContextValue>({
  doc: emptyMobileDoc,
  stack: [],
});

const useMobileDoc: () => MobileDocContextValue = () => {
  return useContext(MobileDocContext);
};

const RenderTextMarker: FC<{ marker: TextMarker }> = ({ marker }) => {
  const { doc, stack } = useMobileDoc();

  for (let opener of marker[1]) {
    const opener_markup = doc.markups[opener];
    stack.push(stackItemFromMarkup(opener_markup));
  }

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  if (top) {
    top.children.push(
      <React.Fragment key={top.children.length.toString()}>
        {marker[3]}
      </React.Fragment>
    );
  } else {
    return <React.Fragment>{marker[3]}</React.Fragment>;
  }

  return popStackItems(stack, marker[2]);
};

const RenderAtomMarker: FC<{ marker: AtomMarker }> = ({ marker }) => {
  return <b>Atom: {marker[3]}</b>;
};

const RenderMarkers: FC<{ markers: Marker[] }> = ({ markers }) => {
  return (
    <React.Fragment>
      {markers.map((marker, index) => {
        switch (marker[0]) {
          case 0:
            return <RenderTextMarker key={index.toString()} marker={marker} />;
          case 1:
            return <RenderAtomMarker key={index.toString()} marker={marker} />;
          default:
            console.error(`Unrecognized marker code: ${marker[0]}`);
            return null;
        }
      })}
    </React.Fragment>
  );
};

const RenderMarkupSection: FC<{ section: MarkupSection }> = ({ section }) => {
  switch (section[1]) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "blockquote":
      return React.createElement(
        section[1],
        null,
        <RenderMarkers markers={section[2]} />
      );
    case "p":
      return (
        <p>
          <RenderMarkers markers={section[2]} />
        </p>
      );

    default:
      console.error(`Unrecognized markup section tag name '${section[1]}'`);
      console.log(section);
      return null;
  }
};

const RenderImageSection: FC<{ section: ImageSection }> = ({ section }) => {
  return null;
};

const RenderListSection: FC<{ section: ListSection }> = ({ section }) => {
  switch (section[1]) {
    case "ol":
    case "ul": {
      const items = section[2].map((markers, index) => (
        <li key={index.toString()}>
          <RenderMarkers markers={markers} />
        </li>
      ));

      return React.createElement(section[1], null, items);
    }

    default:
      console.error(`Unrecognized list section tag name '${section[0]}'`);
      return null;
  }
};

interface BookmarkCardProps {
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

const RenderBookmarkCard: FC<BookmarkCardProps> = ({ url, metadata }) => {
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

interface CodeCardProps {
  code: string;
  language?: string;
  caption?: string;
}

const RenderCodeCard: FC<CodeCardProps> = ({ code, language, caption }) => {
  const highlight = typeof language === "string" && language !== "box-drawing";

  return (
    <figure
      className={cn(styles.codeCard, {
        [styles.codeCardWithCaption]: Boolean(caption),
      })}
    >
      {highlight ? (
        <SyntaxHighlighter useInlineStyles={false} language={language}>
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre>
          <code>{code}</code>
        </pre>
      )}
      {caption && <figcaption dangerouslySetInnerHTML={{ __html: caption }} />}
    </figure>
  );
};

interface ImageCardProps {
  src: string;
  width: number;
  height: number;
  caption?: string;
  cardWidth?: string;
}

const RenderImageCard: FC<ImageCardProps> = ({
  src,
  width,
  height,
  caption,
  cardWidth,
}) => {
  return (
    <figure
      className={cn(styles.imageCard, {
        [styles.imageCardWide]: cardWidth === "wide",
        [styles.imageCardFull]: cardWidth === "full",
        [styles.imageCardWithCaption]: Boolean(caption),
      })}
    >
      <img loading="lazy" width={width} height={height} src={src} />
      {caption && <figcaption dangerouslySetInnerHTML={{ __html: caption }} />}
    </figure>
  );
};

interface MarkdownCardProps {
  markdown: string;
}

const RenderMarkdownCard: FC<MarkdownCardProps> = ({ markdown }) => {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
};

interface HtmlCardProps {
  html: string;
}

const RenderHtmlCard: FC<HtmlCardProps> = ({ html }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

const RenderCardSection: FC<{ section: CardSection }> = ({ section }) => {
  const { doc } = useMobileDoc();
  const card = doc.cards[section[1]];

  switch (card[0]) {
    case "bookmark":
      return <RenderBookmarkCard {...(card[1] as BookmarkCardProps)} />;
    case "code":
      return <RenderCodeCard {...(card[1] as CodeCardProps)} />;
    case "html":
      return <RenderHtmlCard {...(card[1] as HtmlCardProps)} />;
    case "image":
      return <RenderImageCard {...(card[1] as ImageCardProps)} />;
    case "markdown":
      return <RenderMarkdownCard {...(card[1] as MarkdownCardProps)} />;
    default:
      console.error(`Unrecognized card type '${card[0]}'`);
      console.log(card[1]);
      return null;
  }
};

const RenderSection: FC<{ section: Section }> = ({ section }) => {
  switch (section[0]) {
    case 1:
      return <RenderMarkupSection section={section} />;
    case 3:
      return <RenderListSection section={section} />;
    case 10:
      return <RenderCardSection section={section} />;
    default:
      console.error(`Unrecognized section tag ${section[0]}`);
      return null;
  }
};

export const RenderDoc: FC<{ doc: MobileDoc }> = ({ doc }) => {
  return (
    <MobileDocContext.Provider value={{ doc, stack: [] }}>
      {doc.sections.map((section, index) => (
        <RenderSection key={index.toString()} section={section} />
      ))}
    </MobileDocContext.Provider>
  );
};
