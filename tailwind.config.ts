import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // Carlsberg-inspired palette.
        // pine: deep green-tinted neutrals (surfaces, borders, muted text).
        pine: {
          100: "#E9F2EE",
          200: "#CFE0D8",
          300: "#A9C2B7",
          400: "#7C9C8F",
          500: "#5C7D70",
          600: "#44604F",
          700: "#2E4A3E",
          800: "#1E352C",
          900: "#132620",
          950: "#0A1814",
        },
        // brand: Carlsberg green (primary actions, active states).
        brand: {
          300: "#54BD8B",
          400: "#23A065",
          500: "#0E8C4F",
          600: "#0B7141",
          700: "#085A34",
        },
        // gold: refined accent (stars, highlights).
        gold: {
          300: "#E7CF96",
          400: "#D9B964",
          500: "#C5A24A",
          600: "#9F8136",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
