import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const isSingleFile = process.env.SINGLEFILE === "1";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(isSingleFile ? [viteSingleFile()] : []),
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    // Local API (server/src) for development. In production the app talks to
    // Railway directly via VITE_API_URL / DEFAULT_RAILWAY_API_URL.
    proxy: {
      "/api": {
        target: process.env.THURSDAY_API_DEV || "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
});
