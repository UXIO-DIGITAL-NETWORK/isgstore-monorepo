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
    // Page tests mount the real router + a full jsdom tree, and the default
    // worker pool starves them once enough files run at once — failures show
    // up as bare 5s timeouts in whichever file loses the race, not as real
    // assertion failures. 15s is headroom for a contended worker; an
    // unloaded page test still finishes in ~1s.
    testTimeout: 15_000,
  },
});
