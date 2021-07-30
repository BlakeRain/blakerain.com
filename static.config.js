import path from "path";
import React from "react";
import GhostContentAPI from "@tryghost/content-api";

const ContentApi = new GhostContentAPI({
  url: process.env.GHOST_HOSTNAME,
  key: process.env.GHOST_CONTENT_API_KEY,
  version: "v3",
});

const other_settings = {};

const simplifyAuthor = ({ id, name, profile_image, slug }) => {
  return { id, name, profile_image, slug };
};

const authorDictionary = (authors) => {
  return authors.reduce((obj, author) => {
    obj[author.id] = simplifyAuthor(author);
    return obj;
  }, {});
};

const simplifyTag = ({ id, name, slug, description, visibility }) => {
  return { id, name, slug, description, visibility };
};

const tagDictionary = (tags) => {
  return tags.reduce((obj, tag) => {
    obj[tag.id] = simplifyTag(tag);
    return obj;
  }, {});
};

const simplifyPost = ({
  id,
  slug,
  feature_image,
  title,
  custom_excerpt,
  tags,
  authors,
  published_at,
}) => {
  return {
    id,
    slug,
    feature_image,
    title,
    custom_excerpt,
    published_at,
    tags: tags.map((tag) => tag.id),
    authors: authors.map((author) => author.id),
  };
};

export default {
  siteRoot: "https://blakerain.com",

  getSiteData: async () => {
    const settings = await ContentApi.settings.browse({ limit: "all" });
    return { ...settings, ...other_settings };
  },

  getRoutes: async () => {
    const tags = await ContentApi.tags.browse();
    const authors = await ContentApi.authors.browse();
    const posts = await ContentApi.posts.browse({ limit: "all", include: ["authors", "tags"] });
    const pages = await ContentApi.pages.browse({ limit: "all", include: ["authors", "tags"] });

    const page_routes = pages.map((page) => {
      return {
        path: `/${page.slug}`,
        template: "src/containers/Page",
        getData: () => ({
          page,
        }),
      };
    });

    return [
      {
        path: "/",
        getData: () => ({
          authors: authorDictionary(authors),
          tags: tagDictionary(tags),
          posts: posts.map(simplifyPost),
        }),
      },
      {
        path: "/tags",
        getData: () => ({
          tags: tags.filter((tag) => tag.visibility === "public").map(simplifyTag),
        }),
        children: tags
          .filter((tag) => tag.visibility === "public")
          .map((tag) => {
            const tag_posts = posts
              .filter((post) => {
                return post.tags.findIndex((post_tag) => post_tag.id === tag.id) != -1;
              })
              .map(simplifyPost);

            const tag_posts_tags = tags.filter((post_tag) => {
              return tag_posts.reduce((acc, tag_post) => {
                return acc || tag_post.tags.indexOf(post_tag.id) !== -1;
              }, false);
            });

            return {
              path: `/${tag.slug}`,
              template: "src/containers/Tag",
              getData: () => ({
                tag_id: tag.id,
                authors: authorDictionary(authors),
                tags: tagDictionary(tag_posts_tags),
                posts: tag_posts,
              }),
            };
          }),
      },
      {
        path: "/blog",
        getData: () => ({
          authors: authorDictionary(authors),
          tags: tagDictionary(tags),
          posts: posts.map(simplifyPost),
        }),
        children: posts.map((post) => {
          return {
            path: `/${post.slug}`,
            template: "src/containers/BlogPost",
            getData: () => ({ post }),
          };
        }),
      },
      ...page_routes,
    ];
  },

  Document: ({ Html, Head, Body, children, state: { siteDate, renderMeta } }) => (
    <Html lang="en-GB">
      <Head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="referer" content="no-referrer-when-downgrade" />
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
      <Body>
        {children}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/mark.js/8.11.1/mark.min.js"></script>
        <script async defer src="https://sa.blakerain.com/app.js"></script>
        <noscript>
          <img src="https://sa.blakerain.com/image.gif" alt="" />
        </noscript>
      </Body>
    </Html>
  ),

  plugins: [
    [
      require.resolve("react-static-plugin-source-filesystem"),
      {
        location: path.resolve("./src/pages"),
      },
    ],
    require.resolve("react-static-plugin-reach-router"),
    require.resolve("react-static-plugin-sitemap"),
    require.resolve("react-static-plugin-less"),
  ],
};
