// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["app-icon.svg"],
      manifest: {
        name: "Alert Events",
        short_name: "Alerts",
        description: "Team reminders from Google Sheets • calendar exports • mobile-first",
        theme_color: "#0b1220",
        background_color: "#0b1220",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,json,txt,woff,woff2}"],
        navigateFallback: "/index.html",
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
});
