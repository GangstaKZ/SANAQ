export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0F2A4A",
        accent: "#1AFF6C",
        background: "#F5F7FB",
        danger: "#FF4D4F",
      },
      fontFamily: { sans: ["Inter", "Arial", "sans-serif"] },
    },
  },
  plugins: [],
};
