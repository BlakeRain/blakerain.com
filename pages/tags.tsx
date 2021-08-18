import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React, { FC } from "react";
import { DateSpan } from "../components/DateSpan";
import { Layout } from "../components/Layout";
import {
  getSiteSettings,
  getTagsWithPosts,
  ListPost,
  SiteNavigation,
  TagPosts,
} from "../lib/ghost";
import styles from "./tags.module.scss";

const TagPost: FC<{ post: ListPost }> = ({ post }) => {
  return (
    <li>
      <Link href={"/blog/" + post.slug}>
        <a>{post.title}</a>
      </Link>
      <div className={styles.postDateAndTime}>
        <DateSpan date={post.publishedAt || "1970-01-01T00:00:00.000Z"} />
        <span className={styles.readingTime}>{post.readingTime} min read</span>
      </div>
    </li>
  );
};

const Tag: FC<{ tag: TagPosts }> = ({ tag }) => {
  return (
    <article className={styles.tag}>
      <header>
        <h1>
          <Link href={"/tags/" + tag.slug}>{tag.name}</Link>
          <small>({tag.posts.length})</small>
        </h1>
        <p className={styles.description}>{tag.description}</p>
      </header>
      <footer>
        <small>
          Assigned to {tag.posts.length} post{tag.posts.length === 1 ? "" : "s"}:
        </small>
        <ul>
          {tag.posts.map((post) => (
            <TagPost key={post.id} post={post} />
          ))}
        </ul>
      </footer>
    </article>
  );
};

const Tags: FC<{ tags: TagPosts[]; navigation: SiteNavigation[] }> = ({ tags, navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>Tags</title>
      </Head>
      <h1>There are {tags.length} tags on this site</h1>
      <div className={styles.list}>
        {tags
          .sort((a, b) => b.posts.length - a.posts.length)
          .map((tag) => (
            <Tag key={tag.id} tag={tag} />
          ))}
      </div>
    </Layout>
  );
};

export default Tags;

export const getStaticProps: GetStaticProps = async (context) => {
  const tags = await getTagsWithPosts();
  const settings = await getSiteSettings();

  return {
    props: {
      tags: tags,
      navigation: settings.navigation,
    },
  };
};
