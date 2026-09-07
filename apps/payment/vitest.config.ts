import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Pin the timezone before anything reads a Date.
//
// `formatDate`/`formatDateTime` (src/utils/date.ts) render in the *runtime's*
// zone, and the subscription fixtures are written as WIB instants
// ("2026-08-15T00:00:00+07:00"). On a UTC machine — every CI runner — midnight
// WIB is the 14th at 17:00, so a period renders a day early and three merchant
// tests fail while passing on any developer machine at UTC+7 or later.
//
// Set here rather than in setupFiles: workers inherit the parent env at spawn,
// and Node caches the zone on first Date use, so a later assignment is too late.
process.env.TZ = "Asia/Jakarta";

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
    testTimeout: 15_000,
    // Capping workers is the fix for that starvation; the timeout above only
    // ever masked it, and it was already raised 5s -> 15s once for the same
    // reason. On a 10-core machine the default (~9 forks) makes the suite
    // *flaky*: 11 page tests timed out at 15-19s on one run and the identical
    // suite passed on the next. Four forks is both stable (3/3 clean runs)
    // and ~20% faster in wall time (43s vs 55s) — these tests are jsdom- and
    // GC-bound, not CPU-bound, so more forks just means more contention.
    // Raise only alongside evidence that the starvation is gone.
    maxWorkers: 4,
  },
});
