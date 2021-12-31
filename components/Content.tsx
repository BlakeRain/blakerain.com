import React, { FC } from "react";

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

const ContentBody: FC<{ root: Root }> = ({ root }) => {
  return (
    <React.Fragment>
      <div className={styles.content}>
        <div className={styles.contentInner}>
          <Render node={root} />
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
