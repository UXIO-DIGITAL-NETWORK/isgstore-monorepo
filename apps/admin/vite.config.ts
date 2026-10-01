import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      // Local dev talks to the hosted API. Requests are same-origin to Vite and
      // forwarded server-side, which sidesteps the API's CORS allowlist that
      // does not include localhost. Set VITE_API_BASE_URL=/api in .env.local.
      "/api": {
        target: "https://api.isgstore.id",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
