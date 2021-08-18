import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import {
  getAllPostSlugs,
  getPostWithSlug,
  getSiteSettings,
  PostInformation,
  SiteNavigation,
} from "../../lib/ghost";
import { Layout } from "../../components/Layout";
import { Content } from "../../components/Content";

interface BlogPostProps extends PostInformation {
  navigation: SiteNavigation[];
}

export const getStaticPaths: GetStaticPaths = async (context) => {
  const slugs = await getAllPostSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<BlogPostProps, { slug: string }> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<BlogPostProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const settings = await getSiteSettings();
  const post = await getPostWithSlug(context.params?.slug);

  return {
    props: {
      navigation: settings.navigation,
      ...post,
    },
  };
};

const BlogPost: NextPage<BlogPostProps> = ({ post, authors, tags, navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>{post.title}</title>
      </Head>
      <Content authors={authors} tags={tags} post={post} />
    </Layout>
  );
};

export default BlogPost;
