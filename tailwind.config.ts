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
          sky: "#0EA5E9",
          ocean: "#0284C7",
          coral: "#FB7185",
          sunshine: "#F59E0B",
          meadow: "#10B981",
        },
        bg: {
          50: "#ffffff",
          100: "#fefcf8",
          200: "#fdf6ec",
          300: "#f5ebd9",
          400: "#ecdcc4",
        },
        ink: {
          900: "#1e293b",
          700: "#334155",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
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
