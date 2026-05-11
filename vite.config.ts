import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  base: process.env.VITE_BASE_PATH || "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/scheduler/") ||
            id.includes("/loose-envify/") ||
            id.includes("/js-tokens/")
          ) {
            return "react-vendor";
          }

          if (id.includes("/@supabase/")) {
            return "supabase-vendor";
          }

          if (id.includes("/@radix-ui/") || id.includes("/cmdk/") || id.includes("/vaul/")) {
            return "ui-vendor";
          }

          if (id.includes("/recharts/")) {
            return "charts-vendor";
          }
        },
      },
    },
  },
});