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

const simplifyListPost = ({
  id,
  slug,
  feature_image,
  title,
  custom_excerpt,
  tags,
  authors,
  reading_time,
  published_at,
}) => {
  return {
    id,
    slug,
    feature_image,
    title,
    custom_excerpt,
    reading_time,
    published_at,
    tags: tags.map((tag) => tag.id),
    authors: authors.map((author) => author.id),
  };
};

const simplifyDisplayPost = ({
  id,
  slug,
  title,
  custom_excerpt,
  tags,
  authors,
  reading_time,
  published_at,
  html,
}) => {
  return {
    id,
    slug,
    title,
    custom_excerpt,
    reading_time,
    published_at,
    tags: tags.map((tag) => tag.id),
    authors: authors.map((author) => author.id),
    html,
  };
};

export default {
  siteRoot: "https://blakerain.com",

  getSiteData: async () => {
    const { title, navigation, twitter } = await ContentApi.settings.browse({ limit: "all" });
    return { title, navigation, twitter, ...other_settings };
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
          authors: authorDictionary(page.authors),
          tags: tagDictionary(page.tags),
          page: simplifyDisplayPost(page),
        }),
      };
    });

    const postsForTag = (tag_id) => {
      return posts.filter((post) => {
        return post.tags.findIndex((post_tag) => post_tag.id === tag_id) !== -1;
      });
    };

    return [
      {
        path: "/",
        getData: () => ({
          authors: authorDictionary(authors),
          tags: tagDictionary(tags),
          posts: posts.map(simplifyListPost),
        }),
      },
      {
        path: "/tags",
        getData: () => ({
          tags: tags
            .filter((tag) => tag.visibility === "public")
            .map((tag) => {
              tag = simplifyTag(tag);
              return {
                posts: postsForTag(tag.id).map(
                  ({ id, slug, title, published_at, reading_time }) => ({
                    id,
                    slug,
                    title,
                    published_at,
                    reading_time,
                  })
                ),
                ...tag,
              };
            }),
        }),
        children: tags
          .filter((tag) => tag.visibility === "public")
          .map((tag) => {
            const tag_posts = postsForTag(tag.id).map(simplifyListPost);

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
          posts: posts.map(simplifyListPost),
        }),
        children: posts.map((post) => {
          return {
            path: `/${post.slug}`,
            template: "src/containers/BlogPost",
            getData: () => ({
              authors: authorDictionary(post.authors),
              tags: tagDictionary(post.tags),
              post: simplifyDisplayPost(post),
            }),
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
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Body>
        {children}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/components/prism-core.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/plugins/autoloader/prism-autoloader.min.js"></script>
        <script
          dangerouslySetInnerHTML={{ __html: "Prism.languages['box-drawing'] = {};" }}></script>
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
    "enable-jss",
  ],
};
