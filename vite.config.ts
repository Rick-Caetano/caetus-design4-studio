import { defineConfig } from "vite";

// Static site: caetus-studio is a plain HTML/CSS/JS app served as-is by Vite.
export default defineConfig({
  server: {
    host: true,
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
  },
});
