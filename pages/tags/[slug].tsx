import React from "react";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import { SiteNavigation, loadNavigation } from "../../lib/navigation";
import { Tag, loadTags, getTagWithSlug } from "../../lib/tags";
import { PostInfo, loadPostInfos } from "../../lib/content";
import { Layout } from "../../components/Layout";
import { PostCards } from "../../components/PostCard";
import Link from "next/link";
import Analytics from "../../components/Analytics";

export const getStaticPaths: GetStaticPaths = async () => {
  const tags = await loadTags();
  const paths = [];

  for (const tag of tags.values()) {
    paths.push({ params: { slug: tag.slug } });
  }

  return {
    paths,
    fallback: false,
  };
};

interface TagProps {
  tag: Tag;
  posts: PostInfo[];
  tags: { [slug: string]: Tag };
  navigation: SiteNavigation[];
}

export const getStaticProps: GetStaticProps<
  TagProps,
  { slug: string }
> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<TagProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const tag = await getTagWithSlug(context.params?.slug);
  const posts = await loadPostInfos();
  const tags = await loadTags();
  const navigation = await loadNavigation();

  return {
    props: {
      tag,
      navigation,
      tags: Object.fromEntries(tags),
      posts: posts.filter((post) => post.tags.indexOf(tag.slug) !== -1),
    },
  };
};

const TagPosts: NextPage<TagProps> = ({ tag, posts, tags, navigation }) => {
  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>{tag.name} Tag</title>
      </Head>
      <h1>
        <Link href={"/tags"}>
          <a>Tags</a>
        </Link>{" "}
        / {tag.name}
        <small>
          There are {posts.length} post{posts.length === 1 ? "" : "s"} with this
          tag
        </small>
      </h1>
      <PostCards posts={posts} tags={new Map(Object.entries(tags))} />
      <Analytics />
    </Layout>
  );
};

export default TagPosts;
