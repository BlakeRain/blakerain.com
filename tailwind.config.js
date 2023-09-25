module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "#22293D",
          DEFAULT: "#13304E",
          light: "#1C4773",
        },
      },
    },
  },
  content: [
    "./macros/src/**/*.rs",
    "./src/**/*.rs",
    "./index.html",
    "./style/**/*.css",
  ],
  plugins: [require("@tailwindcss/forms")],
};
