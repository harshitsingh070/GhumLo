/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  // Light-only theme: no dark mode. `dark:` variants are unused.
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", '"Times New Roman"', "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
      },
      colors: {
        background: "#F7F9FC",
        surface: "#FFFFFF",
        surfacesecondary: "#F1F5F9",
        navy: "#102A43",
        secondary: "#52606D",
        muted: "#829AB1",
        primary: "#FF6B57",
        primaryhover: "#F25542",
        primarylight: "#FFF1EE",
        success: "#22C55E",
        successlight: "#ECFDF3",
        info: "#3B82F6",
        infolight: "#EFF6FF",
        warning: "#F59E0B",
        warninglight: "#FFFBEB",
        purple: "#8B5CF6",
        purplelight: "#F5F3FF",
        cream: "#F7F9FC",
        sand: "#F1F5F9",
        ink: "#102A43",
        smoke: "#52606D",
        pine: "#0EA5A4",
        leaf: "#22C55E",
        line: "#E5E7EB",
      },
      boxShadow: {
        card: "0 4px 20px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 12px 28px -12px rgb(23 32 51 / 0.14)",
        pop: "0 20px 45px -18px rgb(23 32 51 / 0.18)",
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
}
