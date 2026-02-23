module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-custom-media": {},
    "postcss-nesting": {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === "production" ? { cssnano: { preset: "default" } } : {}),
  },
};
