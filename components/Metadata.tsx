import React, { FC } from "react";
import { parseISO } from "date-fns";
import { PostInfo, Tag } from "../lib/content";

const PostMetadata: FC<{
  post: PostInfo;
  tags: Tag[];
}> = ({ post, tags }) => {
  const ld: { [key: string]: any } = {
    "@context": "https://schema.org",
    "@type": "Article",
    publisher: {
      "@type": "Organisation",
      name: "Blake Rain",
      url: "https://www.blakerain.com/",
      logo: {
        "@type": "ImageObject",
        url: "https://www.blakerain.com/media/logo-text.png",
      },
    },
    headline: post.title,
    url: `https://www.blakerain.com/blog/${post.slug}`,
    keywords: tags.map((tag) => tag.name).join(", "),
    author: {
      "@type": "Person",
      name: "Blake Rain",
      image: {
        "@type": "ImageObject",
        url: "https://www.blakerain.com/media/profile.png",
      },
    },
  };

  if (post.published) {
    ld["datePublished"] = parseISO(post.published).toISOString();
  }

  if (post.excerpt) {
    ld["description"] = post.excerpt;
  }

  return (
    <React.Fragment>
      {/* OpenGraph */}
      <meta property="og:site_name" content="Blake Rain" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.title} />
      {post.excerpt && (
        <meta property="og:description" content={post.excerpt} />
      )}
      <meta
        property="og:url"
        content={"https://blakerain.com/post/" + post.slug}
      />
      {post.published && (
        <meta
          property="article:published_time"
          content={parseISO(post.published).toISOString()}
        />
      )}
      {tags.map((tag, index) => (
        <meta
          key={index.toString()}
          property="article:tag"
          content={tag.name}
        />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={post.title} />
      <meta name="twitter:site" content="@HalfWayMan" />
      <meta name="twitter:creator" content="@HalfWayMan" />
      {post.excerpt && (
        <meta name="twitter:description" content={post.excerpt} />
      )}
      <meta
        name="twitter:url"
        content={`https://www.blakerain.com/blog/${post.slug}`}
      />
      {post.coverImage && (
        <meta
          name="twitter:image"
          content={`https://www.blakerain.com/content/${post.coverImage}`}
        />
      )}
      <meta name="twitter:label1" content="Writte by" />
      <meta name="twitter:data1" content="Blake Rain" />
      {tags.length > 0 && (
        <React.Fragment>
          <meta name="twitter:label2" content="Filed under" />
          <meta
            name="twitter:data2"
            content={tags.map((tag) => tag.name).join(", ")}
          />
        </React.Fragment>
      )}

      {/* LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      ></script>
    </React.Fragment>
  );
};

export default PostMetadata;
