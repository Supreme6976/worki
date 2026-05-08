import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    // Explicitly set the entries
    client: { entry: "src/entry-client.tsx" },
    server: { entry: "src/entry-server.tsx" },
  },
  vite: {
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return;
          warn(warning);
        },
      },
    },
  },
});
