import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// No `globals: true` in vitest.config.ts, so @testing-library/react's
// automatic afterEach-cleanup (which only registers when it finds a global
// `afterEach`) never fires — wire it up explicitly, or renders pile up in
// the jsdom document across tests in the same file.
//
// Unmounting a Radix dialog (the focus-scope) queues its own unmount cleanup
// on `setTimeout(…, 0)`. If the file ends right after, that timer can fire
// after Vitest has torn down the jsdom environment — globals then fall back to
// Node's, so the `CustomEvent` it dispatches is no longer a jsdom Event and
// jsdom throws "parameter 1 is not of type 'Event'". Vitest counts that as an
// unhandled error and fails the run even though every test passed (it only
// ever surfaced on the slower CI runner, never locally). Awaiting a macrotask
// tick after cleanup lets the queued timer run while the document is still
// alive, instead of racing the teardown.
afterEach(async () => {
  cleanup();
  // A few suites install fake timers and restore them in their own afterEach;
  // hook order is not guaranteed, so normalise here or the flush below would
  // wait forever on a faked clock.
  vi.useRealTimers();
  await new Promise((resolve) => setTimeout(resolve, 0));
});

// The feature services call a real API now, so page tests need something on
// the other end of axios. `fakeApi` serves the same envelope and paginator the
// backend does, which means the services' mappers still run for real — a
// mapper regression fails a page test instead of quietly rendering blanks.
//
// Files that assert on the *request* (the service contract tests) re-mock
// `@/lib/axios` themselves, which takes precedence over this. `axios.test.ts`,
// which exercises the real interceptors, calls `vi.unmock` instead.
vi.mock("@/lib/axios", async () => {
  const { createFakeApi } = await import("./fakeApi");
  return { api: createFakeApi() };
});

// The panel now defaults to Indonesian, but every screen except the navbar is
// still hardcoded English, and ~100 test files query those English strings by
// their accessible names. Pin the harness to `en` so a test asserts against the
// language of the code it is testing, and so the default can change again
// without a hundred files needing edits. Language *switching* is covered
// explicitly in src/hooks/useLocale.test.tsx, which sets its own locale.
import i18n from "@/config/i18n";

// `beforeAll`, not a bare call: `changeLanguage` resolves on a microtask, so a
// fire-and-forget at module load leaves the first render in the default
// language. Awaiting it here runs once per test file, before anything mounts.
beforeAll(async () => {
  await i18n.changeLanguage("en");
});

// Recent Node versions ship a native (but non-functional without a backing
// file) global `localStorage` that shadows jsdom's — the custom ThemeProvider
// (src/providers/theme-provider.tsx) reads it on mount, so give it a working
// in-memory stub.
class LocalStorageStub implements Storage {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length() {
    return this.store.size;
  }
}
Object.defineProperty(window, "localStorage", { value: new LocalStorageStub(), writable: true });

// jsdom doesn't implement ResizeObserver; Radix primitives construct one when
// they mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverStub;

// jsdom doesn't implement matchMedia; the custom ThemeProvider
// (src/providers/theme-provider.tsx) calls it whenever theme === "system".
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom doesn't implement the Clipboard API; the financial feature's
// CopyableAmount calls navigator.clipboard.writeText(). navigator is
// read-only in jsdom, so it must be replaced via defineProperty.
// configurable: true lets @testing-library/user-event redefine it too.
Object.defineProperty(navigator, "clipboard", {
  writable: true,
  configurable: true,
  value: { writeText: vi.fn() },
});

// jsdom doesn't implement PointerEvent capture or scrollIntoView; Radix
// Select's trigger/option handlers call hasPointerCapture/
// releasePointerCapture on click, and its viewport calls scrollIntoView
// when an item is selected — both throw as "not a function" otherwise. Only
// surfaces once a test actually opens a Select and clicks an option (the
// categories Add-form's submit-validation tests are the first to do so).
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};

// jsdom doesn't implement elementFromPoint; `input-otp` (the 2FA code entry)
// calls it from a setTimeout to decide whether the pointer is still over the
// input. Because it fires on a timer, it lands *after* the test that triggered
// it has finished, so it surfaced as an unhandled exception that failed the
// whole run while every test still passed. `null` is what a real browser
// returns for a point with nothing on it.
Document.prototype.elementFromPoint ??= () => null;
