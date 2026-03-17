import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2015",
    outDir: "dist",
    emptyOutDir: true,
    base: "./",
    rollupOptions: {
      input: {
        ui: path.resolve(__dirname, "ui.html"),
      },
      output: {
        entryFileNames: "ui.js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    minify: true,
    sourcemap: true,
  },
});
