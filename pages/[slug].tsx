import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import {
  Page,
  loadPages,
  getPageWithSlug,
  SiteNavigation,
  loadNavigation,
} from "../lib/content";
import { Layout } from "../components/Layout";
import { Content } from "../components/Content";
import Analytics from "../components/Analytics";

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await loadPages();

  return {
    paths: pages.map((page) => ({ params: { slug: page.slug } })),
    fallback: false,
  };
};

interface PageProps {
  navigation: SiteNavigation[];
  page: Page;
}

export const getStaticProps: GetStaticProps<
  PageProps,
  { slug: string }
> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<PageProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const navigation = await loadNavigation();
  const page = await getPageWithSlug(context.params?.slug);

  return {
    props: {
      navigation,
      page,
    },
  };
};

const PageView: NextPage<PageProps> = ({ navigation, page }) => {
  return (
    <Layout navigation={navigation}>
      <Head>
        <title>{page.title}</title>
      </Head>
      <Content doc={page} root={page.root} />
      <Analytics />
    </Layout>
  );
};

export default PageView;
