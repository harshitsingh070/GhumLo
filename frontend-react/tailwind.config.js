/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  // Toggle-driven dark mode: App sets `dark` class + data-theme="dark" on
  // <html> (class drives the variants; data-theme is the semantic marker).
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "Manrope", "Inter", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        cream: "#F7F3EA",
        sand: "#E7F1F1",
        ink: "#174A5B",
        smoke: "#5C7880",
        clay: {
          DEFAULT: "#FF7F66",
          dark: "#E96B55",
        },
        pine: "#0B7285",
        leaf: "#2A9D8F",
        line: "#D7E5E6",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(23 32 51 / 0.05)",
        "card-hover": "0 12px 28px -12px rgb(23 32 51 / 0.22)",
        pop: "0 20px 45px -18px rgb(23 32 51 / 0.35)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
}
