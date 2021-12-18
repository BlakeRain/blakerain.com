import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import React from "react";
import Analytics from "../components/Analytics";
import { Layout } from "../components/Layout";
import { PostCards } from "../components/PostCard";
import {
  AuthorDictionary,
  getAllAuthors,
  getAllListPosts,
  getAllTags,
  getSiteSettings,
  ListPost,
  SiteNavigation,
  TagDictionary,
} from "../lib/ghost";

export const getStaticProps: GetStaticProps = async (context) => {
  const posts = await getAllListPosts();
  const authors = await getAllAuthors();
  const tags = await getAllTags();
  const settings = await getSiteSettings();

  return {
    props: {
      posts: posts,
      tags: tags,
      authors: authors,
      navigation: settings.navigation,
    },
  };
};

const Blog: NextPage<{
  posts: ListPost[];
  authors: AuthorDictionary;
  tags: TagDictionary;
  navigation: SiteNavigation[];
}> = ({ posts, authors, tags, navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>Blog</title>
      </Head>
      <PostCards posts={posts} authors={authors} tags={tags} />
      <Analytics />
    </Layout>
  );
};

export default Blog;
