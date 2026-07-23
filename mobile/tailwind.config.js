/** @type {import('tailwindcss').Config} */

// Helper : token piloté par une variable CSS, avec support de l'opacité (`bg-x/10`).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Surfaces (résolues depuis les variables CSS → clair/sombre)
        canvas: v("canvas"),
        background: v("background"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        "surface-3": v("surface-3"),
        border: v("border"),
        "border-soft": v("border-soft"),

        // Brand (violet Ticket2Stock)
        primary: {
          DEFAULT: v("primary"),
          dark: v("primary-dark"),
          soft: v("primary-soft"),
        },

        // Texte
        ink: v("ink"),
        muted: v("muted"),
        subtle: v("subtle"),

        // Accents sémantiques
        danger: v("danger"),
        warning: v("warning"),
        info: v("info"),
        success: v("success"),
        pink: v("pink"),
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
