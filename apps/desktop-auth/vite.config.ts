import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: ".",
  base: "./",
  build: {
    outDir: "dist/renderer",
  },
  resolve: {
    alias: {
      "@logos": path.resolve(__dirname, "../admin/src/assets/logos"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
});
