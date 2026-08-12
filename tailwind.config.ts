import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#6366F1",
          violet: "#8B5CF6",
          purple: "#A855F7",
        },
        bg: {
          50: "#ffffff",
          100: "#f9f9f8",
          200: "#f0f0ee",
          300: "#e6e6e3",
          400: "#d1d1ce",
        },
        ink: {
          900: "#1a1a1a",
          700: "#353535",
          500: "#6b6b6b",
          400: "#8e8e8e",
          300: "#b4b4b4",
        },
      },
      fontFamily: {
        sans: ["PingFang SC", "Montserrat", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.45s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
