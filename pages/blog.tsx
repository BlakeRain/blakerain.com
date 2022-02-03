import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import React from "react";
import Analytics from "../components/Analytics";
import { Layout } from "../components/Layout";
import { PostCards } from "../components/PostCard";

import { SiteNavigation, loadNavigation } from "../lib/utils";
import { Tag, loadTags } from "../lib/tags";
import { PostInfo, loadPostInfos } from "../lib/content";

export const getStaticProps: GetStaticProps = async () => {
  const tags = await loadTags();
  const navigation = await loadNavigation();
  const posts = await loadPostInfos();

  return {
    props: {
      navigation,
      tags: Object.fromEntries(tags),
      posts,
    },
  };
};

const Blog: NextPage<{
  navigation: SiteNavigation[];
  tags: { [slug: string]: Tag };
  posts: PostInfo[];
}> = ({ navigation, tags, posts }) => {
  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>Blake Rain</title>
      </Head>
      <PostCards feature posts={posts} tags={new Map(Object.entries(tags))} />
      <Analytics />
    </Layout>
  );
};

export default Blog;
