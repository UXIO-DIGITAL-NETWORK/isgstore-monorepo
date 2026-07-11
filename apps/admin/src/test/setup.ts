import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// No `globals: true` in vitest.config.ts, so @testing-library/react's
// automatic afterEach-cleanup (which only registers when it finds a global
// `afterEach`) never fires — wire it up explicitly, or renders pile up in
// the jsdom document across tests in the same file.
afterEach(cleanup);

// RootLayout mounts TanStackRouterDevtools unconditionally; it's dev-only
// tooling with no bearing on any test assertion, and something in its jsdom
// behavior is pathologically slow (tests otherwise finishing in ~150ms take
// 10-25s with it mounted) — stub it out everywhere.
vi.mock("@tanstack/router-devtools", () => ({
  TanStackRouterDevtools: () => null,
}));

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

// jsdom doesn't implement ResizeObserver; TanStackRouterDevtools (mounted
// unconditionally in RootLayout) needs it to exist.
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
