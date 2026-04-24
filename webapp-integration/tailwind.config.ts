import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#2563EB",
          hover:   "#1D4ED8",
          light:   "#EFF6FF",
          mid:     "#DBEAFE",
          text:    "#1E40AF",
        },
        success: {
          DEFAULT: "#16A34A",
          hover:   "#15803D",
          banner:  "#22C55E",
          light:   "#F0FDF4",
          mid:     "#DCFCE7",
          text:    "#15803D",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light:   "#FFFBEB",
          mid:     "#FDE68A",
          text:    "#92400E",
        },
        danger: {
          DEFAULT: "#DC2626",
          light:   "#FEF2F2",
          mid:     "#FEE2E2",
        },
        surface: "#FFFFFF",
        border: {
          DEFAULT: "#F3F4F6",
          input:   "#E5E7EB",
        },
        fg: {
          1: "#111827",
          2: "#1F2937",
          3: "#374151",
          4: "#4B5563",
          5: "#6B7280",
          6: "#9CA3AF",
        },
      },
      borderRadius: {
        sm:   "6px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-geist-mono)", "Courier New", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.10), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
