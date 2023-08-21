module.exports = {
  theme: {
    extend: {
      fontFamily: {
        text: ["Noto Serif", "serif"],
      },
      colors: {
        primary: {
          dark: "#22293D",
          DEFAULT: "#13304E",
        },
      },
    },
  },
  content: ["./src/**/*.rs", "./index.html", "./style/**/*.css"],
  plugins: [require("@tailwindcss/forms")],
};
