import { describe, expect, it } from "vitest";

import { bannerHref } from "./bannerHref";

describe("bannerHref", () => {
  it("leaves an absolute URL alone", () => {
    expect(bannerHref("https://example.com/promo", "id")).toBe("https://example.com/promo");
    expect(bannerHref("http://example.com", "en")).toBe("http://example.com");
  });

  it("prefixes the locale onto a storefront path", () => {
    expect(bannerHref("/berita", "id")).toBe("/id/berita");
    expect(bannerHref("/berita", "en")).toBe("/en/berita");
  });

  it("adds the leading slash an operator may have left out", () => {
    expect(bannerHref("daftar-harga", "en")).toBe("/en/daftar-harga");
  });

  it("does not prefix a path that already carries the locale", () => {
    // Otherwise a link copied from the address bar would become /id/id/berita.
    expect(bannerHref("/id/berita", "id")).toBe("/id/berita");
  });

  it("returns null for a banner with nowhere to go", () => {
    // The slide then stays a plain image rather than an anchor leading nowhere.
    expect(bannerHref(null, "id")).toBeNull();
    expect(bannerHref("", "id")).toBeNull();
    expect(bannerHref(undefined, "id")).toBeNull();
  });
});
