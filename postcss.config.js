const tailwind = require("tailwindcss")("./tailwind.config.js");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [
    tailwind,
    ...(process.env.HUGO_ENVIRONMENT === "production" ? [autoprefixer] : []),
  ],
};
