import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { FC } from "react";
import { DateSpan } from "../components/DateSpan";
import { Layout } from "../components/Layout";
import { SiteNavigation, loadNavigation } from "../lib/utils";
import { PostInfo, loadPostInfos } from "../lib/content";
import { Tag, Tags, loadTags } from "../lib/tags";
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
  tags: Tags;
  posts: PostInfo[];
  navigation: SiteNavigation[];
}> = ({ tags, posts, navigation }) => {
  const binned_tags: { tag: Tag; posts: PostInfo[] }[] = Object.keys(tags)
    .map((key) => tags[key])
    .map((tag) => ({
      tag,
      posts: posts.filter((post) => post.tags.indexOf(tag.slug) !== -1),
    }))
    .filter((tag) => tag.posts.length > 0)
    .sort((a, b) => b.posts.length - a.posts.length);

  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Tags</title>
      </Head>
      <h1>There are {tags.length} tags on this site</h1>
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
      tags,
      posts,
      navigation,
    },
  };
};
