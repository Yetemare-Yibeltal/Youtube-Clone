/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          light: "#ffffff",
          dark: "#0f0f0f",
        },
        panel: {
          light: "#f9f9f9",
          dark: "#212121",
        },
        brand: {
          DEFAULT: "#ff0000",
          hover: "#cc0000",
        },
      },
      fontFamily: {
        sans: ["Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
