import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/** Cloudflare plugin loads Workers/miniflare during dev — optional so plain `vite` works locally. */
async function maybeCloudflare(command: "build" | "serve") {
  if (command !== "build" && process.env.CLOUDFLARE_DEV !== "true") {
    return null;
  }
  const { cloudflare } = await import("@cloudflare/vite-plugin");
  return cloudflare();
}

export default defineConfig(async ({ command }) => {
  const cf = await maybeCloudflare(command);

  return {
    plugins: [react(), tailwindcss(), ...(cf ? [cf] : [])],
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
  };
});
