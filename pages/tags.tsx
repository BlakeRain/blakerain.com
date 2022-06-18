import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { FC } from "react";
import { DateSpan } from "../components/display/DateSpan";
import { Layout } from "../components/Layout";
import { SiteNavigation, loadNavigation } from "../lib/utils";
import { PostInfo, loadPostInfos } from "../lib/content";
import { Tag, loadTags } from "../lib/tags";
import styles from "./tags.module.scss";

const TagPost: FC<{ post: PostInfo }> = ({ post }) => {
  return (
    <li>
      <Link href={"/blog/" + post.slug}>
        <a>{post.title}</a>
      </Link>
      <div className={styles.postDateAndTime}>
        <DateSpan date={post.published || "1970-01-01T00:00:00.000Z"} />
        <span className={styles.readingTime}>{post.readingTime} min read</span>
      </div>
    </li>
  );
};

const TagInfo: FC<{ tag: Tag; posts: PostInfo[] }> = ({ tag, posts }) => {
  return (
    <article className={styles.tag}>
      <header>
        <h1>
          <Link href={"/tags/" + tag.slug}>{tag.name}</Link>
          <small>({posts.length})</small>
        </h1>
        <p className={styles.description}>{tag.description}</p>
      </header>
      <footer>
        <small>
          Assigned to {posts.length} post{posts.length === 1 ? "" : "s"}:
        </small>
        <ul>
          {posts.map((post, index) => (
            <TagPost key={index.toString()} post={post} />
          ))}
        </ul>
      </footer>
    </article>
  );
};

const TagList: FC<{
  tags: { [slug: string]: Tag };
  posts: PostInfo[];
  navigation: SiteNavigation[];
}> = ({ tags, posts, navigation }) => {
  let binned_tags: { tag: Tag; posts: PostInfo[] }[] = [];
  for (const tag of new Map(Object.entries(tags)).values()) {
    binned_tags.push({
      tag,
      posts: posts.filter((post) => post.tags.includes(tag.slug)),
    });
  }

  binned_tags = binned_tags
    .filter((bin) => bin.posts.length > 0)
    .sort((a, b) => b.posts.length - a.posts.length);

  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Tags</title>
      </Head>
      <h1>There are {binned_tags.length} tags on this site</h1>
      <div className={styles.list}>
        {binned_tags.map((tag, index) => (
          <TagInfo key={index.toString()} {...tag} />
        ))}
      </div>
    </Layout>
  );
};

export default TagList;

export const getStaticProps: GetStaticProps = async () => {
  const tags = await loadTags();
  const posts = await loadPostInfos();
  const navigation = await loadNavigation();

  return {
    props: {
      tags: Object.fromEntries(tags),
      posts,
      navigation,
    },
  };
};
