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
import { useEffect, useRef } from "react";
import Analytics from "../../components/Analytics";
import Metadata from "../../components/Metadata";

interface BlogPostProps extends PostInformation {
  enableCommento: boolean;
  navigation: SiteNavigation[];
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await getAllPostSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<
  BlogPostProps,
  { slug: string }
> = async (
  context: GetStaticPropsContext<{ slug: string }>
): Promise<GetStaticPropsResult<BlogPostProps>> => {
  if (!context.params) {
    throw new Error("Context missing parameters");
  }

  const settings = await getSiteSettings();
  const post = await getPostWithSlug(context.params?.slug);

  return {
    props: {
      enableCommento: settings.enableCommento,
      navigation: settings.navigation,
      ...post,
    },
  };
};

const BlogPost: NextPage<BlogPostProps> = ({
  post,
  authors,
  tags,
  navigation,
  enableCommento,
}) => {
  const commento = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enableCommento) {
      const existing = document.querySelector("script#commento-script");
      if (!existing) {
        console.log("Inserting commento.io script");
        const commento_script = document.createElement(
          "SCRIPT"
        ) as HTMLScriptElement;
        commento_script.id = "commento-script";
        commento_script.defer = true;
        commento_script.src = "https://cdn.commento.io/js/commento.js";
        commento.current?.parentNode?.appendChild(commento_script);
      }
    }
  });

  return (
    <Layout navigation={navigation}>
      <Head>
        <title>{post.title}</title>
        <Metadata post={post} authors={authors} tags={tags} />
      </Head>
      <Content authors={authors} tags={tags} post={post} />
      <Analytics />
      {enableCommento && (
        <section className="post-comments">
          <div ref={commento} id="commento"></div>
        </section>
      )}
    </Layout>
  );
};

export default BlogPost;
