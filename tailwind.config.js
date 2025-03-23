// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#90EE90",
          DEFAULT: "#00D54B",
          dark: "#118C4F",
        },
        secondary: {
          light: "#FFD700",
          DEFAULT: "#F3BA2F",
          dark: "#E49B0F",
        },
        dark: {
          lighter: "#232323",
          light: "#1A1A1A",
          DEFAULT: "#121212",
          dark: "#0C0C0C",
          darker: "#000000",
        },
        accent: {
          blue: "#1da1f2",
          purple: "#9945FF",
          red: "#ff4c4c",
          pink: "#FF52A2",
        },
        gray: {
          lightest: "#f5f5f5",
          lighter: "#d4d4d4",
          light: "#a3a3a3",
          DEFAULT: "#737373",
          dark: "#525252",
          darker: "#303030",
          darkest: "#171717",
        },
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
      },
      borderRadius: {
        widget: "16px",
      },
      boxShadow: {
        widget: "0 8px 30px rgba(0, 0, 0, 0.12)",
        "widget-hover": "0 8px 30px rgba(0, 0, 0, 0.25)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-widget": "linear-gradient(145deg, #171717 0%, #0A0A0A 100%)",
      },
    },
  },
  plugins: [],
};
