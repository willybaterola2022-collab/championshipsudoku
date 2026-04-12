import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["favicon.svg", "og-image.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/rpc\/get_sudoku_daily/,
            handler: "NetworkFirst",
            options: {
              cacheName: "sudoku-daily-cache",
              expiration: { maxEntries: 1, maxAgeSeconds: 3600 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
      manifest: {
        name: "Championship Sudoku — Free Sudoku with AI Hints",
        short_name: "ChampionSudoku",
        description: "Classic and Killer Sudoku with AI hint coach, daily puzzles, streaks, XP, and leaderboard.",
        theme_color: "#d4a843",
        background_color: "#0a0c10",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["games", "puzzle"],
        lang: "es",
        dir: "ltr",
        icons: [
          { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "/og-image.svg", sizes: "1200x630", type: "image/svg+xml", purpose: "any" },
        ],
        shortcuts: [
          { name: "Daily Puzzle", short_name: "Daily", url: "/daily", icons: [{ src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml" }] },
          { name: "Play", short_name: "Play", url: "/play", icons: [{ src: "/favicon.svg", sizes: "192x192", type: "image/svg+xml" }] },
        ],
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
