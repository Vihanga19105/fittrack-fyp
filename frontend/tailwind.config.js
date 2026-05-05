/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: "[#EEF4FF]",
        navyslate: "indigo-700",
        card: "#2A2F4F",
        card1: "#ffffff",
        accent: "#38BDF8",
      },
    },
  },
  plugins: [],
};
