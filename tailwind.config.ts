import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6EF",
        paper: "#F3ECE1",
        charcoal: "#2E2A25",
        sage: {
          50: "#F3F5F0",
          100: "#E4E9DD",
          300: "#B7C4A8",
          500: "#8A9A78",
          700: "#5E6E4E",
        },
        terracotta: {
          50: "#FBF0E8",
          200: "#EAC5A8",
          400: "#D19A67",
          600: "#B4763F",
        },
        gold: "#B08D57",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
