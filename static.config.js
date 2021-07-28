import path from "path";
import React from "react";
import GhostContentAPI from "@tryghost/content-api";

const ContentApi = new GhostContentAPI({
  url: process.env.GHOST_HOSTNAME,
  key: process.env.GHOST_CONTENT_API_KEY,
  version: "v3",
});

const other_settings = {};

export default {
  getSiteData: async () => {
    const settings = await ContentApi.settings.browse({ limit: "all" });
    return { ...settings, ...other_settings };
  },

  getRoutes: async () => {
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
          posts,
        }),
      },
      {
        path: "/blog",
        getData: () => ({
          posts,
        }),
        children: posts.map((post) => {
          console.log("PAGE", post.id);
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
      <Body>{children}</Body>
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
