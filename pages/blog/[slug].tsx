import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  GetStaticPropsResult,
  NextPage,
} from "next";
import Head from "next/head";
import { NextSeo, ArticleJsonLd } from "next-seo";
import { SiteNavigation, loadNavigation } from "../../lib/utils";
import { Post, loadPostSlugs, loadPostWithSlug } from "../../lib/content";
import { Tag, loadTags } from "../../lib/tags";
import { Layout } from "../../components/Layout";
import { Content } from "../../components/Content";
import { useEffect, useRef } from "react";
import Analytics from "../../components/Analytics";

interface BlogPostProps {
  enableCommento: boolean;
  navigation: SiteNavigation[];
  tags: Tag[];
  post: Post;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = await loadPostSlugs();

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

  const navigation = await loadNavigation();
  const tags = await loadTags();
  const post = await loadPostWithSlug(context.params?.slug);

  return {
    props: {
      enableCommento: false,
      navigation: navigation,
      tags: post.tags.reduce((acc, tag_slug) => {
        const tag = tags.get(tag_slug);
        if (tag) {
          acc.push(tag);
        }
        return acc;
      }, [] as Tag[]),
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
      </Head>
      <NextSeo
        title={post.title}
        description={post.excerpt || undefined}
        canonical={`https://www.blakerain.com/blog/${post.slug}`}
        openGraph={{
          url: `https://www.blakerain.com/blog/${post.slug}`,
          title: post.title,
          type: "article",
          description: post.excerpt || undefined,
          images: post.coverImage
            ? [
                {
                  url: post.coverImage,
                  alt: post.title,
                },
              ]
            : [],
          article: {
            publishedTime: post.published,
            authors: ["Blake Rain"],
            tags: tags.map((tag) => tag.name),
          },
        }}
      />
      <ArticleJsonLd
        type="Blog"
        title={post.title}
        description={post.excerpt || ""}
        url={`https://www.blakerain.com/blog/${post.slug}`}
        images={post.coverImage ? [post.coverImage] : []}
        datePublished={post.published}
        authorName={"Blake Rain"}
        publisherName="blakerain.com"
        publisherLogo="https://www.blakerain.com/media/logo-text.png"
      />
      <Content
        tags={tags}
        doc={post}
        content={post.content}
        featureImage={post.coverImage || undefined}
      />
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
