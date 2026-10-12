import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Cairo", "sans-serif"] },
      colors: {
        primary: { DEFAULT: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
        surface: { DEFAULT: "#0f172a", card: "#1e293b", border: "#334155" },
      },
    },
  },
  plugins: [],
} satisfies Config;
