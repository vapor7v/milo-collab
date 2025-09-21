import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.25rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2rem",
        "2xl": "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Nunito", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#7c3aed", // Main purple
          50: "#f5f3ff",   // Very light purple for backgrounds
          100: "#ede9fe",  // Light purple for cards
          200: "#ddd6fe",  // Lighter purple for accents
          300: "#c4b5fd",  // Light purple for borders
          400: "#a78bfa",  // Medium light purple
          500: "#7c3aed",  // Main purple for buttons
          600: "#6d28d9",  // Darker purple for hovers
          700: "#5b21b6",  // Dark purple for active states
          800: "#4c1d95",  // Very dark purple
          900: "#3b0764",  // Darkest purple for text
        },
        secondary: {
          DEFAULT: "#a78bfa", // Light purple for secondary actions
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#a78bfa",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        destructive: {
          DEFAULT: "#dc2626", // Red for errors/destructive actions
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#c4b5fd", // Light purple for accents
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#c4b5fd",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        wellness: {
          safe: "#7c3aed", // Purple for completed tasks
          concerned: "#a78bfa", // Light purple for warnings
          warning: "#c4b5fd", // Lighter purple for alerts
          critical: "#dc2626", // Red for critical issues
        },
      },
      borderRadius: {
        lg: `var(--radius)`,
        md: `calc(var(--radius) - 4px)`,
        sm: `calc(var(--radius) - 8px)`,
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      screens: {
        'xs': '475px',
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
      },
      fontSize: {
        'xs-mobile': ['0.875rem', { lineHeight: '1.25rem' }],
        'sm-mobile': ['0.9375rem', { lineHeight: '1.375rem' }],
        'base-mobile': ['1rem', { lineHeight: '1.5rem' }],
        'lg-mobile': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl-mobile': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl-mobile': ['1.5rem', { lineHeight: '2rem' }],
        '3xl-mobile': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      boxShadow: {
        "neumorphic-sm": "4px 4px 8px hsl(var(--muted)), -4px -4px 8px #ffffff",
        "neumorphic-sm-inset": "inset 4px 4px 8px hsl(var(--muted)), inset -4px -4px 8px #ffffff",
        "neumorphic": "6px 6px 12px hsl(var(--muted)), -6px -6px 12px #ffffff",
        "neumorphic-inset": "inset 6px 6px 12px hsl(var(--muted)), inset -6px -6px 12px #ffffff",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "icon-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "fade-in-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "icon-float": "icon-float 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;