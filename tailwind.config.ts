import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sparksquare: {
          fuchsia: {
            light: "#F5D0FE",
            DEFAULT: "#D946EF",
            medium: "#C026D3",
            dark: "#A21CAF",
          },
          violet: {
            light: "#DDD6FE",
            DEFAULT: "#8B5CF6",
            medium: "#7C3AED",
            dark: "#6D28D9",
          },
          cyan: {
            light: "#A5F3FC",
            DEFAULT: "#06B6D4",
            medium: "#0891B2",
            dark: "#0E7490",
          },
        },
      },
      backgroundImage: {
        "gradient-radial-spotlight":
          "radial-gradient(circle at var(--cursor-x, 50%) var(--cursor-y, 50%), rgba(217, 70, 239, 0.1), rgba(139, 92, 246, 0.1), transparent 40%)",
        "gradient-mesh":
          "linear-gradient(to right, rgba(217, 70, 239, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 1px, transparent 1px)",
      },
      boxShadow: {
        "neon-fuchsia": "0 0 20px rgba(217, 70, 239, 0.3)",
        "neon-violet": "0 0 20px rgba(139, 92, 246, 0.3)",
        "neon-cyan": "0 0 20px rgba(6, 182, 212, 0.3)",
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        "float-slow": "float 12s ease-in-out infinite",
        "float-slower": "float 16s ease-in-out infinite",
        "pulse-slow": "pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-slower": "pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
 