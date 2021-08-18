import { FC } from "react";
import { AuthorDictionary, ListPost, TagDictionary } from "../lib/ghost";
import cn from "classnames";
import Link from "next/link";
import styles from "./PostCard.module.scss";
import { PostDetails } from "./PostDetails";
import { TagList } from "./TagList";

export const PostCard: FC<{
  post: ListPost;
  large: boolean;
  tags: TagDictionary;
  authors: AuthorDictionary;
}> = ({ post, large, tags, authors }) => {
  return (
    <article className={cn(styles.postCard, { [styles.postCardLarge]: large })}>
      {post.featureImage ? (
        <Link href={"/blog/" + post.slug}>
          <a>
            <img src={post.featureImage} alt={post.title} />
          </a>
        </Link>
      ) : null}
      <div className={styles.postCardInner}>
        <Link href={"/blog/" + post.slug}>
          <a>
            <header>{post.title}</header>
            {post.customExcerpt ? <section>{post.customExcerpt}</section> : null}
          </a>
        </Link>
        <PostDetails post={post} authors={authors}>
          <TagList tagsDict={tags} tags={post.tags} />
        </PostDetails>
      </div>
    </article>
  );
};

export const PostCards: FC<{
  authors: AuthorDictionary;
  tags: TagDictionary;
  posts: ListPost[];
}> = ({ authors, tags, posts }) => {
  return (
    <div className={styles.postCards}>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} large={index === 0} tags={tags} authors={authors} />
      ))}
    </div>
  );
};
