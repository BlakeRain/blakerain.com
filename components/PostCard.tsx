import { FC } from "react";
import cn from "classnames";
import Link from "next/link";

import { Tag, Tags } from "../lib/tags";
import { PostInfo } from "../lib/content";
import { PostDetails } from "./PostDetails";
import { TagList } from "./TagList";
import Image from "./Image";

import styles from "./PostCard.module.scss";

export const PostCard: FC<{
  post: PostInfo;
  large: boolean;
  tags: Tag[];
}> = ({ post, large, tags }) => {
  return (
    <article className={cn(styles.postCard, { [styles.postCardLarge]: large })}>
      {post.coverImage ? (
        <Link href={"/blog/" + post.slug}>
          <a className={styles.postCardCoverImage}>
            <Image
              src={post.coverImage}
              alt={post.title}
              layout="fill"
              objectFit="cover"
              priority={true}
            />
          </a>
        </Link>
      ) : null}
      <div className={styles.postCardInner}>
        <Link href={"/blog/" + post.slug}>
          <a>
            <header>{post.title}</header>
            {post.excerpt ? <section>{post.excerpt}</section> : null}
          </a>
        </Link>
        <PostDetails doc={post}>
          <TagList tags={tags} />
        </PostDetails>
      </div>
    </article>
  );
};

export const PostCards: FC<{
  tags: Tags;
  posts: PostInfo[];
  feature?: boolean;
}> = ({ tags, posts, feature }) => {
  return (
    <div className={styles.postCards}>
      {posts.map((post, index) => (
        <PostCard
          key={index.toString()}
          post={post}
          large={Boolean(feature) && index === 0 && posts.length > 2}
          tags={post.tags.reduce((acc, tag_slug) => {
            const tag = tags.get(tag_slug);
            if (tag) {
              acc.push(tag);
            }
            return acc;
          }, [] as Tag[])}
        />
      ))}
    </div>
  );
};
