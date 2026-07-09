import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Separate from vite.config.ts: no TanStack Router codegen plugin, no Tailwind
// plugin — unnecessary overhead for unit tests. routeTree.gen.ts is already
// generated on disk and imported directly by test-utils.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
