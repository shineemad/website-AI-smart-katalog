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
        ink: "#1F1F25",
        "ink-soft": "#2F2F42",
        gray2: "#606073",
        "gray-muted": "#86869F",
        "gray-faint": "#9797A6",
        "blue-deep": "#1916B0",
        "blue-electric": "#2F64ED",
        "blue-sky": "#7CB1FF",
        "bg-soft": "#F5F5FA",
        lavender: "#E0E0EB",
        "blue-tint": "#EAF0FD",
        success: "#059669",
        danger: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        display: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-archivo)", "sans-serif"],
        mono: ["var(--font-fragment)", "monospace"],
      },
      borderRadius: {
        sm2: "6px",
        md2: "12px",
        lg2: "20px",
        xl2: "28px",
      },
      maxWidth: {
        page: "1200px",
      },
      transitionTimingFunction: {
        swift: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
