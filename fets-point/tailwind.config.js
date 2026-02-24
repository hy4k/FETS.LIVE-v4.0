/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // FETS Brand Colors
        "accent-yellow": "#fbc00e",
        "accent-mimosa": "#f4d03f",
        turquoise: "#29b3ff",
        cyan: "#81eaff",
        dark: "#1a1a1a",

        // Status Colors
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",

        primary: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
          800: "#854d0e",
          900: "#713f12",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
