import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Disable Cloudflare plugin to avoid worker-entry and Cloudflare-specific builds
  cloudflare: false,
  tanstackStart: {
    // Re-enable the server entry to keep custom error handling, 
    // but now it will be optimized for Vercel via Nitro.
    server: { entry: "server" },
  },
});
