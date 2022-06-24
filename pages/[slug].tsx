import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import { NextSeo } from "next-seo";
import { SiteNavigation, loadNavigation } from "../lib/navigation";
import { Page, loadPageSlugs, loadPageWithSlug } from "../lib/content";
import { Layout } from "../components/Layout";
import { Content } from "../components/article/Content";
import Analytics from "../components/Analytics";

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await loadPageSlugs();

  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
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
  const page = await loadPageWithSlug(context.params?.slug);

  return {
    props: {
      navigation,
      page,
    },
  };
};

const PageView: NextPage<PageProps> = ({ navigation, page }) => {
  const seo_index = page.preamble.seo?.index;
  const seo_follow = page.preamble.seo?.follow;

  return (
    <Layout navigation={navigation} wrap>
      <Head>
        <title>{page.title}</title>
        {(typeof seo_index === "boolean" ? seo_index : true) && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebPage",
                name: page.title,
                description: page.excerpt || undefined,
                publisher: {
                  "@type": "ProfilePage",
                  name: "BlakeRain's Website",
                },
              }),
            }}
          />
        )}
      </Head>
      <NextSeo
        noindex={typeof seo_index === "boolean" ? !seo_index : false}
        nofollow={typeof seo_follow === "boolean" ? !seo_follow : false}
        title={page.title}
        description={page.excerpt || undefined}
        canonical={`https://www.blakerain.com/${page.slug}`}
        openGraph={{
          url: `https://www.blakerain.com/${page.slug}`,
          title: page.title,
          description: page.excerpt || undefined,
        }}
      />
      <Content doc={page} content={page.content} />
      <Analytics />
    </Layout>
  );
};

export default PageView;
