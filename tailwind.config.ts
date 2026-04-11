import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        serif: ["'Playfair Display'", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        gold: {
          DEFAULT: "hsl(43 90% 55%)",
          muted: "hsl(43 60% 45%)",
          dim: "hsl(43 40% 30%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "cell-pop": { "0%": { transform: "scale(0.9)" }, "50%": { transform: "scale(1.08)" }, "100%": { transform: "scale(1)" } },
        "cell-error": { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-4px)" }, "75%": { transform: "translateX(4px)" } },
        "glow-pulse": { "0%,100%": { boxShadow: "0 0 20px hsla(43,90%,55%,0.3)" }, "50%": { boxShadow: "0 0 40px hsla(43,90%,55%,0.6)" } },
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out",
        "cell-pop": "cell-pop 200ms ease-out",
        "cell-error": "cell-error 300ms ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
