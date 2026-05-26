/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          "primary": "#8b5cf6",       // Violet 500
          "secondary": "#ec4899",     // Pink 500
          "accent": "#10b981",        // Emerald 500
          "neutral": "#1f2937",       // Gray 800
          "base-100": "#0f172a",      // Slate 900 (Deep modern dark background)
          "base-200": "#1e293b",      // Slate 800
          "base-300": "#334155",      // Slate 700
          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      },
      "light",
    ],
    darkTheme: "dark", // default theme
  },
};
