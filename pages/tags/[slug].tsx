import React from "react";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import {
  AuthorDictionary,
  getAllAuthors,
  getAllTags,
  getAllTagSlugs,
  getPostsWithTag,
  getSiteSettings,
  getTagWithSlug,
  ListPost,
  SimpleTag,
  SiteNavigation,
  TagDictionary,
} from "../../lib/ghost";
import { Layout } from "../../components/Layout";
import { PostCards } from "../../components/PostCard";
import Link from "next/link";
import Analytics from "../../components/Analytics";

export const getStaticPaths: GetStaticPaths = async (context) => {
  const slugs = await getAllTagSlugs();
  console.log(slugs);
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

interface TagProps {
  tag: SimpleTag;
  posts: ListPost[];
  authors: AuthorDictionary;
  tags: TagDictionary;
  navigation: SiteNavigation[];
}

export const getStaticProps: GetStaticProps<TagProps, { slug: string }> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<TagProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const tag = await getTagWithSlug(context.params?.slug);
  const posts = await getPostsWithTag(tag.slug);
  const authors = await getAllAuthors();
  const tags = await getAllTags();
  const settings = await getSiteSettings();

  return {
    props: {
      tag: tag,
      posts: posts,
      tags: tags,
      authors: authors,
      navigation: settings.navigation,
    },
  };
};

const Tag: NextPage<TagProps> = ({ tag, posts, authors, tags, navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>{tag.name} Tag</title>
      </Head>
      <h1>
        <Link href={"/tags"}>
          <a>Tags</a>
        </Link>{" "}
        / {tag.name}
        <small>
          There are {posts.length} post{posts.length === 1 ? "" : "s"} with this tag
        </small>
      </h1>
      <PostCards posts={posts} authors={authors} tags={tags} />
      <Analytics />
    </Layout>
  );
};

export default Tag;
