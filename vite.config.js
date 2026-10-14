import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "icon.svg"],
      manifest: {
        name: "SANAQ — Управление магазином",
        short_name: "SANAQ",
        lang: "ru",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F7FB",
        theme_color: "#0F2A4A",
        icons: [
          { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2}"],
        maximumFileSizeToCacheInBytes: 4000000,
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
