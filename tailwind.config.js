/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5EBDC",
        sand: "#E8D3BA",
        terracotta: {
          50: "#FFF3EC",
          100: "#FADFD0",
          200: "#F2BFA0",
          300: "#E69B74",
          400: "#D7784E",
          500: "#C65E34",
          600: "#A74B28",
          700: "#843B22",
          800: "#5F2C1D"
        },
        forest: {
          50: "#EEF5EE",
          100: "#D8E8D7",
          200: "#B7D2B3",
          300: "#92BB8D",
          400: "#6CA368",
          500: "#4D8650",
          600: "#3D6A41",
          700: "#315334",
          800: "#243C26"
        }
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"]
      },
      boxShadow: {
        card: "0 18px 40px rgba(95, 44, 29, 0.12)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(198, 94, 52, 0.18), transparent 45%), radial-gradient(circle at bottom right, rgba(77, 134, 80, 0.14), transparent 35%)"
      }
    }
  },
  plugins: []
};
