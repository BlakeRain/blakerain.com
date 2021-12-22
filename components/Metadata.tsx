import React, { FC } from "react";
import { parseISO } from "date-fns";
import { AuthorDictionary, ListPost, TagDictionary } from "../lib/ghost";

const PostMetadata: FC<{
  post: ListPost;
  authors: AuthorDictionary;
  tags: TagDictionary;
}> = ({ post, authors, tags }) => {
  const resolved_authors = post.authors
    .map((author_id) => authors[author_id])
    .filter((author) => typeof author !== "undefined");
  const resolved_tags = post.tags
    .map((tag_id) => tags[tag_id])
    .filter((tag) => typeof tag !== "undefined" && tag.visibility === "public");
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
    keywords: resolved_tags.map((tag) => tag.name).join(", "),
  };

  if (post.publishedAt) {
    ld["datePublished"] = parseISO(post.publishedAt).toISOString();
  }

  if (post.updatedAt) {
    ld["dateModified"] = parseISO(post.updatedAt).toISOString();
  }

  if (post.customExcerpt) {
    ld["description"] = post.customExcerpt;
  }

  if (resolved_authors.length > 0) {
    const author = resolved_authors[0];

    ld["author"] = {
      "@type": "Person",
      name: author.name,
    };

    if (author.profileImage) {
      ld["author"]["image"] = {
        "@type": "ImageObject",
        url: author.profileImage,
      };
    }
  }

  return (
    <React.Fragment>
      {/* OpenGraph */}
      <meta property="og:site_name" content="Blake Rain" />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={post.title} />
      {post.customExcerpt && (
        <meta property="og:description" content={post.customExcerpt} />
      )}
      <meta
        property="og:url"
        content={"https://blakerain.com/post/" + post.slug}
      />
      {post.publishedAt && (
        <meta
          property="article:published_time"
          content={parseISO(post.publishedAt).toISOString()}
        />
      )}
      {post.updatedAt && (
        <meta
          property="article:modified_time"
          content={parseISO(post.updatedAt).toISOString()}
        />
      )}
      {resolved_tags.map((tag, index) => (
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
      {post.customExcerpt && (
        <meta name="twitter:description" content={post.customExcerpt} />
      )}
      <meta
        name="twitter:url"
        content={`https://www.blakerain.com/blog/${post.slug}`}
      />
      {post.featureImage && (
        <meta name="twitter:image" content={post.featureImage} />
      )}
      {resolved_authors.map((author, index) => (
        <React.Fragment key={index.toString()}>
          <meta name={`twitter:label${1 + index}`} content="Written by" />
          <meta name={`twitter:data${1 + index}`} content={author.name} />
        </React.Fragment>
      ))}
      {resolved_tags.length > 0 && (
        <React.Fragment>
          <meta
            name={`twitter:label${1 + post.authors.length}`}
            content="Filed under"
          />
          <meta
            name={`twitter:data${1 + post.authors.length}`}
            content={resolved_tags.map((tag) => tag.name).join(", ")}
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
