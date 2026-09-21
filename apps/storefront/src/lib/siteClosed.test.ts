import { describe, expect, it, beforeEach } from "vitest";

import {
  closureFromError,
  getSiteClosure,
  isAlwaysOpenUrl,
  setSiteClosure,
  subscribeSiteClosure,
} from "./siteClosed";

beforeEach(() => setSiteClosure(null));

describe("closureFromError", () => {
  it("reads the licence block out of a 503", () => {
    const closure = closureFromError({
      response: {
        status: 503,
        data: { data: { licence: { status: "suspended", reason: "Belum bayar", ends_at: null } } },
      },
    });

    expect(closure).toEqual({
      status: "suspended",
      reason: "Belum bayar",
      ends_at: null,
      checkout_url: null,
    });
  });

  it("ignores a 503 that carries no licence block", () => {
    // A restarting container or a proxy with nothing behind it. Telling a
    // customer the shop has not paid its bill would be a lie.
    expect(closureFromError({ response: { status: 503, data: {} } })).toBeNull();
    expect(closureFromError({ response: { status: 503 } })).toBeNull();
  });

  it("ignores every other status", () => {
    expect(closureFromError({ response: { status: 500, data: { data: { licence: {} } } } })).toBeNull();
    expect(closureFromError(new Error("network"))).toBeNull();
    expect(closureFromError(undefined)).toBeNull();
  });
});

describe("isAlwaysOpenUrl", () => {
  it("treats the endpoints that answer while the site is dark as always-open", () => {
    // A 200 from any of these is not evidence the public side is open, so the
    // interceptor must not let it clear the notice.
    expect(isAlwaysOpenUrl("/v1/storefront/settings")).toBe(true);
    expect(isAlwaysOpenUrl("/v1/auth/login")).toBe(true);
    expect(isAlwaysOpenUrl("/v1/auth/refresh")).toBe(true);
    expect(isAlwaysOpenUrl("/v1/ping")).toBe(true);
  });

  it("treats the gated endpoints as the reopening signal", () => {
    expect(isAlwaysOpenUrl("/v1/games")).toBe(false);
    expect(isAlwaysOpenUrl("/v1/games/mobile-legends/products")).toBe(false);
    expect(isAlwaysOpenUrl("/v1/checkout")).toBe(false);
    expect(isAlwaysOpenUrl(undefined)).toBe(false);
  });
});

describe("setSiteClosure", () => {
  it("notifies subscribers once per distinct closure", () => {
    // A page fires several requests in parallel; each one fails with the same
    // 503, and the notice must not re-render per response.
    const seen: (string | null)[] = [];
    const unsubscribe = subscribeSiteClosure((closure) => seen.push(closure?.status ?? null));

    const closure = { status: "expired", reason: null, ends_at: null, checkout_url: null };
    setSiteClosure(closure);
    setSiteClosure({ ...closure });
    setSiteClosure({ ...closure });

    expect(seen).toEqual(["expired"]);
    expect(getSiteClosure()?.status).toBe("expired");

    unsubscribe();
  });

  it("clears when the site comes back", () => {
    setSiteClosure({ status: "suspended", reason: null, ends_at: null, checkout_url: null });
    setSiteClosure(null);

    expect(getSiteClosure()).toBeNull();
  });
});
