module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          dark: "#0D1B2A",
          DEFAULT: "#1B263B",
          light: "#415A77",
          lighter: "#778DA9",
        },
      },
    },
  },
  content: ["./src/**/*.rs", "./index.html", "./style/**/*.css"],
  plugins: [require("@tailwindcss/forms")],
};
