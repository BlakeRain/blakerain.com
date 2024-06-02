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
  content: ["./hugo_stats.json", "./extra_stats.json"],
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
