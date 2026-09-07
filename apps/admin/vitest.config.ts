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
    // up as bare timeouts in whichever file loses the race, not as real
    // assertion failures. 15s is headroom for a contended worker; an
    // unloaded page test still finishes in ~1s.
    // CI runners are far smaller and colder than a dev machine, and the first
    // test in a file pays for the whole module graph. 15s is ample locally but
    // was not on GitHub's runner, where exactly one test — the first in
    // FeedbackDeleteFlow — timed out while its own file's later tests passed.
    testTimeout: process.env.CI ? 30_000 : 15_000,
    // Capping workers is the fix for that starvation; the timeout above only
    // ever masked it, and it was already raised 5s -> 15s once for the same
    // reason. On a 10-core machine the default (~9 forks) makes the suite
    // *flaky*: 11 page tests timed out at 15-19s on one run and the identical
    // suite passed on the next. Four forks is both stable (3/3 clean runs)
    // and ~20% faster in wall time (43s vs 55s) — these tests are jsdom- and
    // GC-bound, not CPU-bound, so more forks just means more contention.
    // Raise only alongside evidence that the starvation is gone.
    // ...and the same starvation argument cuts harder on CI: four forks on a
    // 4-core runner is over-subscribed, so halve it there. Local stays at 4.
    maxWorkers: process.env.CI ? 2 : 4,
  },
});
