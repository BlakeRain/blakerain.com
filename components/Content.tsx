import React, { FC } from "react";
import { ParsedUrlQuery } from "querystring";
import { useRouter } from "next/router";

import { Root } from "mdast";
import { DocInfo, Tag } from "../lib/content";

import { ScrollToTopButton } from "./ScrollToTop";
import { PostDetails } from "./PostDetails";
import { TagList } from "./TagList";
import { Render } from "./Document";

import styles from "./Content.module.scss";

const ContentHeader: FC<{ tags?: Tag[]; doc: DocInfo }> = ({ tags, doc }) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{doc.title}</h1>
      {tags && <TagList tags={tags} large />}
      {doc.excerpt ? <p className={styles.excerpt}>{doc.excerpt}</p> : null}
      <div className={styles.details}>
        <PostDetails doc={doc} />
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
      <div className={styles.content}>
        <div className={styles.contentInner}>
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
  root: Root;
}

export const Content: FC<ContentProps> = ({ tags, doc, root }) => {
  return (
    <article className="post">
      <ContentHeader tags={tags} doc={doc} />
      <ContentBody root={root} />
    </article>
  );
};
