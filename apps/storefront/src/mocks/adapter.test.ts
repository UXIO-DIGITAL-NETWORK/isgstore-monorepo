import { describe, expect, it } from "vitest";

import { ok, paginate, strParam, toInt } from "./envelope";
import { matchHandler, parseRequestBody, pathOf } from "./match";
import type { MockHandler } from "./types";

const handlers: MockHandler[] = [
  {
    method: "GET",
    pattern: /^\/v1\/games\/([^/]+)\/products$/,
    resolve: () => ok({ groups: [], products: [] }),
  },
  { method: "GET", pattern: /^\/v1\/games\/([^/]+)$/, resolve: () => ok(null) },
  { method: "POST", pattern: /^\/v1\/checkout$/, resolve: () => ok(null) },
];

describe("pathOf", () => {
  it("strips the query string", () => {
    expect(pathOf("/v1/games?sort=popular")).toBe("/v1/games");
  });

  it("tolerates an undefined url", () => {
    expect(pathOf(undefined)).toBe("");
  });
});

describe("parseRequestBody", () => {
  it("parses a JSON string body", () => {
    expect(parseRequestBody('{"code":"HEMAT10"}')).toEqual({ code: "HEMAT10" });
  });

  it("returns the raw value when it is not valid JSON", () => {
    expect(parseRequestBody("not-json")).toBe("not-json");
  });

  it("passes a non-string body through untouched", () => {
    const body = new URLSearchParams({ a: "1" });
    expect(parseRequestBody(body)).toBe(body);
  });
});

describe("matchHandler", () => {
  it("prefers the first matching handler", () => {
    const found = matchHandler("GET", "/v1/games/mobile-legends/products", handlers);
    expect(found?.match[1]).toBe("mobile-legends");
    expect(found?.handler.pattern.source).toBe("^\\/v1\\/games\\/([^/]+)\\/products$");
  });

  it("falls through to a shorter pattern when the specific one misses", () => {
    const found = matchHandler("GET", "/v1/games/mobile-legends", handlers);
    expect(found?.handler.pattern.source).toBe("^\\/v1\\/games\\/([^/]+)$");
  });

  it("requires the method to match", () => {
    expect(matchHandler("POST", "/v1/games", handlers)).toBeNull();
    expect(matchHandler("POST", "/v1/checkout", handlers)?.handler.method).toBe("POST");
  });

  it("returns null when nothing matches", () => {
    expect(matchHandler("GET", "/v1/unknown", handlers)).toBeNull();
  });
});

describe("paginate", () => {
  const rows = Array.from({ length: 25 }, (_, index) => index + 1);

  it("slices the requested page and reports the paginator", () => {
    const response = paginate(rows, { per_page: 10, page: 2 }, "/v1/things");
    expect(response.status).toBe("success");
    expect(response.data.data).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(response.data.meta).toMatchObject({
      current_page: 2,
      last_page: 3,
      per_page: 10,
      total: 25,
      from: 11,
      to: 20,
      path: "/v1/things",
    });
  });

  it("handles an empty list", () => {
    const response = paginate([], {}, "/v1/things");
    expect(response.data.data).toEqual([]);
    expect(response.data.meta).toMatchObject({ current_page: 1, last_page: 1, total: 0, from: null, to: null });
  });
});

describe("param helpers", () => {
  it("falls back for missing or invalid integers", () => {
    expect(toInt("3", 15)).toBe(3);
    expect(toInt(undefined, 15)).toBe(15);
    expect(toInt("0", 15)).toBe(15);
    expect(toInt("nope", 15)).toBe(15);
  });

  it("reads only strings as params", () => {
    expect(strParam("  hello ")).toBe("hello");
    expect(strParam(5)).toBe("");
  });
});
