import { defineConfig } from "vitest/config";
import { imagetools } from "vite-imagetools";
import path from "node:path";

/**
 * Kept separate from vite.config.ts so the TanStack Router plugin does not run
 * during tests — it regenerates routeTree.gen.ts, which these tests do not
 * need and which would make a test run mutate tracked source.
 */
export default defineConfig({
  plugins: [
    // Modules under test (mappers, toOrder, games) import `?w=...&format=webp`
    // image URLs, so the same transform has to run here.
    imagetools({
      include: /\.(png|jpe?g)(\?.*)?$/i,
      defaultDirectives: (url) => {
        const directives = new URLSearchParams();
        if (!url.searchParams.has("format")) directives.set("format", "webp");
        return directives;
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
