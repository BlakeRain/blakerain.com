import { FC } from "react";
import { AuthorDictionary, DisplayPost, TagDictionary } from "../lib/ghost";
import styles from "./Content.module.scss";
import { PostDetails } from "./PostDetails";
import { TagList } from "./TagList";
import SyntaxHighlighter from "./SyntaxHighlighter";

const ContentHeader: FC<ContentProps> = ({ authors, tags, post }) => {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{post.title}</h1>
      <TagList tagsDict={tags} tags={post.tags} large />
      {post.customExcerpt ? <p className={styles.excerpt}>{post.customExcerpt}</p> : null}
      <div className={styles.details}>
        <PostDetails authors={authors} post={post} />
      </div>
    </header>
  );
};

const ContentBody: FC<{ post: DisplayPost }> = ({ post }) => {
  return (
    <SyntaxHighlighter>
      <div className="post-content">
        <div className="inner" dangerouslySetInnerHTML={{ __html: post.html }} />
      </div>
    </SyntaxHighlighter>
  );
};

export interface ContentProps {
  authors: AuthorDictionary;
  tags: TagDictionary;
  post: DisplayPost;
}

export const Content: FC<ContentProps> = ({ authors, tags, post }) => {
  return (
    <article className="post">
      <ContentHeader authors={authors} tags={tags} post={post} />
      <ContentBody post={post} />
    </article>
  );
};
