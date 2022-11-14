import React, { FC } from "react";
import cn from "classnames";
import { ParsedUrlQuery } from "querystring";
import { useRouter } from "next/router";
import { MDXRemoteSerializeResult } from "next-mdx-remote";

import { DocInfo } from "../../lib/content";
import { Tag } from "../../lib/tags";

import { ScrollToTopButton } from "../fields/ScrollToTop";
import { PostDetails } from "../PostDetails";
import { TagList } from "../display/TagList";
import { Render } from "./Render";

import styles from "./Content.module.scss";
import { GitLogEntry } from "../../lib/git";
import RevisionHistory from "./RevisionHistory";

const ContentHeader: FC<{
  tags?: Tag[];
  doc: DocInfo;
  featureImage?: string;
}> = ({ tags, doc, featureImage }) => {
  return (
    <header
      className={cn(styles.header, styles.outer, {
        [styles.headerWithImage]: Boolean(featureImage),
      })}
      style={{
        backgroundImage: featureImage
          ? `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${featureImage})`
          : undefined,
      }}
    >
      <div className={cn(styles.headerInner, styles.inner)}>
        <h1 className={styles.title}>{doc.title}</h1>
        {doc.excerpt ? <p className={styles.excerpt}>{doc.excerpt}</p> : null}
        <div className={styles.details}>
          <PostDetails doc={doc} />
          {tags && <TagList tags={tags} large />}
        </div>
      </div>
    </header>
  );
};

function getHighlightTerms(search: ParsedUrlQuery): string[] {
  if ("highlight" in search) {
    const term = search["highlight"];
    if (typeof term === "string" && term.length > 0) {
      return term.split(" ");
    }
  }

  return [];
}

const ContentBody: FC<{
  content: MDXRemoteSerializeResult;
  history: GitLogEntry[];
}> = ({ content, history }) => {
  const router = useRouter();
  const highlight = getHighlightTerms(router.query);

  return (
    <React.Fragment>
      <div className={cn(styles.content, styles.outer)}>
        <div className={cn(styles.contentInner, styles.inner)}>
          <Render content={content} highlight={highlight} />
          {history.length && <RevisionHistory history={history} />}
        </div>
      </div>
      <ScrollToTopButton />
    </React.Fragment>
  );
};

export interface ContentProps {
  tags?: Tag[];
  doc: DocInfo;
  featureImage?: string;
  content: MDXRemoteSerializeResult;
  history?: GitLogEntry[];
}

export const Content: FC<ContentProps> = ({
  tags,
  doc,
  featureImage,
  content,
  history = [],
}) => {
  return (
    <article className="post">
      <ContentHeader tags={tags} doc={doc} featureImage={featureImage} />
      <ContentBody content={content} history={history} />
    </article>
  );
};
