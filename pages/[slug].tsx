import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import {
  getAllPageSlugs,
  getPageWithSlug,
  getSiteSettings,
  PageInformation,
  SiteNavigation,
} from "../lib/ghost";
import { Layout } from "../components/Layout";
import { Content } from "../components/Content";

export const getStaticPaths: GetStaticPaths = async (context) => {
  const slugs = await getAllPageSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

interface PageProps extends PageInformation {
  navigation: SiteNavigation[];
}

export const getStaticProps: GetStaticProps<PageProps, { slug: string }> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<PageProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const settings = await getSiteSettings();
  const page = await getPageWithSlug(context.params?.slug);

  return {
    props: {
      navigation: settings.navigation,
      ...page,
    },
  };
};

const Page: NextPage<PageProps> = ({ page, authors, tags, navigation }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>{page.title}</title>
      </Head>
      <Content authors={authors} tags={tags} post={page} />
    </Layout>
  );
};

export default Page;
