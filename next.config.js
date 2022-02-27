/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  images: {
    loader: "custom",
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
});
