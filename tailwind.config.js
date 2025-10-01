module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        "cartographer-light": "url('/media/cartographer-light.webp')",
        "cartographer-dark": "url('/media/cartographer-dark.webp')",
      },
      colors: {
        primary: {
          dark: "#22293D",
          DEFAULT: "#13304E",
          light: "#1C4773",
        },
      },
    },
  },
  content: ["./hugo_stats.json", "./extra_stats.json", "./content/**/*.js", "./static/**/*.js"],
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
