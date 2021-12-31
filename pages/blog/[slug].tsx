import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import {
  SiteNavigation,
  loadNavigation,
  Post,
  loadPostInfos,
  getPostWithSlug,
  Tag,
  loadTags,
} from "../../lib/content";
import { Layout } from "../../components/Layout";
import { Content } from "../../components/Content";
import { useEffect, useRef } from "react";
import Analytics from "../../components/Analytics";
import Metadata from "../../components/Metadata";

interface BlogPostProps {
  enableCommento: boolean;
  navigation: SiteNavigation[];
  tags: Tag[];
  post: Post;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await loadPostInfos();

  return {
    paths: posts.map((post) => ({ params: { slug: post.slug } })),
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

  const navigation = await loadNavigation();
  const tags = await loadTags();
  const post = await getPostWithSlug(context.params?.slug);

  return {
    props: {
      enableCommento: false,
      navigation: navigation,
      tags: post.tags.map((tag) => tags[tag]),
      post,
    },
  };
};

const BlogPost: NextPage<BlogPostProps> = ({
  post,
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
        <Metadata post={post} tags={tags} />
      </Head>
      <Content tags={tags} doc={post} root={post.root} />
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
