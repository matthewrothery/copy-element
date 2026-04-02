import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import manifest from "./extension/prod.manifest";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        app: "app.html",
        authCallback: "auth-callback.html",
        preview: "preview.html"
      }
    }
  }
});
