import React, { FC } from "react";
import cn from "classnames";
import { ParsedUrlQuery } from "querystring";
import { useRouter } from "next/router";

import { Root } from "mdast";
import { DocInfo, Tag } from "../lib/content";

import { ScrollToTopButton } from "./ScrollToTop";
import { PostDetails } from "./PostDetails";
import { TagList } from "./TagList";
import { Render } from "./Document";

import styles from "./Content.module.scss";

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
const ContentBody: FC<{ root: Root }> = ({ root }) => {
  const router = useRouter();
  const highlight = getHighlightTerms(router.query);

  return (
    <React.Fragment>
      <div className={cn(styles.content, styles.outer)}>
        <div className={cn(styles.contentInner, styles.inner)}>
          <Render node={root} highlight={highlight} />
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
  root: Root;
}

export const Content: FC<ContentProps> = ({
  tags,
  doc,
  featureImage,
  root,
}) => {
  return (
    <article className="post">
      <ContentHeader tags={tags} doc={doc} featureImage={featureImage} />
      <ContentBody root={root} />
    </article>
  );
};
