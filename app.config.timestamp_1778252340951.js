// app.config.ts
import { createApp } from "vinxi";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
var app_config_default = createApp({
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public"
    },
    {
      name: "client",
      type: "client",
      handler: "./src/entry-client.tsx",
      target: "browser",
      plugins: () => [
        tsconfigPaths(),
        TanStackRouterVite(),
        tanstackStart(),
        react()
      ]
    },
    {
      name: "server",
      type: "handler",
      handler: "./src/entry-server.tsx",
      target: "server",
      plugins: () => [
        tsconfigPaths(),
        TanStackRouterVite(),
        tanstackStart(),
        react()
      ]
    }
  ]
});
export {
  app_config_default as default
};
