import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Kept separate from vite.config.ts so the TanStack Router plugin does not run
 * during tests — it regenerates routeTree.gen.ts, which these tests do not
 * need and which would make a test run mutate tracked source.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
