import { createApp } from "vinxi";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default createApp({
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public",
    },
    {
      name: "client",
      type: "client",
      handler: "./src/entry-client.tsx",
      target: "browser",
      plugins: () => [
        TanStackRouterVite(),
        tanstackStart(),
        react(),
      ],
    },
    {
      name: "server",
      type: "http",
      handler: "./src/entry-server.tsx",
      target: "server",
      plugins: () => [
        TanStackRouterVite(),
        tanstackStart(),
        react(),
      ],
    },
  ],
});
