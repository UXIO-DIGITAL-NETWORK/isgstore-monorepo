import { describe, expect, it } from "vitest";

import { E164_PATTERN, normalizeWhatsappNumber, sanitizePhoneInput } from "./phone";

describe("sanitizePhoneInput", () => {
  it("keeps a typed country code instead of eating it", () => {
    // The regression that made foreign numbers impossible to enter: the old
    // helper ran on every keystroke and stripped the "+" as soon as it appeared.
    expect(sanitizePhoneInput("+65")).toBe("+65");
    expect(sanitizePhoneInput("+6591234567")).toBe("+6591234567");
  });

  it("strips formatting but not meaning", () => {
    expect(sanitizePhoneInput("+62 812-3456-7890")).toBe("+6281234567890");
    expect(sanitizePhoneInput("0812 3456 7890")).toBe("081234567890");
  });

  it("leaves a local number local", () => {
    // The field must not rewrite what someone is halfway through typing.
    expect(sanitizePhoneInput("0812")).toBe("0812");
    expect(sanitizePhoneInput("")).toBe("");
  });
});

describe("normalizeWhatsappNumber", () => {
  it("expands an Indonesian local number", () => {
    expect(normalizeWhatsappNumber("081234567890")).toBe("+6281234567890");
    expect(normalizeWhatsappNumber("6281234567890")).toBe("+6281234567890");
    expect(normalizeWhatsappNumber("+62 812-3456-7890")).toBe("+6281234567890");
  });

  it("keeps a foreign number as given", () => {
    expect(normalizeWhatsappNumber("+6591234567")).toBe("+6591234567");
    expect(normalizeWhatsappNumber("+1 (415) 555-0132")).toBe("+14155550132");
    expect(normalizeWhatsappNumber("00 65 9123 4567")).toBe("+6591234567");
  });

  it("survives a round trip through the input field", () => {
    // The corruption this replaces: a stored "+6591234567" was shown as
    // "6591234567" and saved back as "+626591234567" — a different number, every
    // time the customer opened their settings and pressed save.
    const stored = "+6591234567";
    expect(normalizeWhatsappNumber(sanitizePhoneInput(stored))).toBe(stored);

    const local = "+6281234567890";
    expect(normalizeWhatsappNumber(sanitizePhoneInput(local))).toBe(local);
  });

  it("never produces a leading zero", () => {
    for (const raw of ["081234567890", "0081234567890", "+62 0812 3456 7890"]) {
      const result = normalizeWhatsappNumber(raw);
      expect(result.startsWith("+0")).toBe(false);
    }
  });

  it("returns an empty string rather than a bare plus", () => {
    expect(normalizeWhatsappNumber("")).toBe("");
    expect(normalizeWhatsappNumber("+")).toBe("");
    expect(normalizeWhatsappNumber("   ")).toBe("");
  });
});

describe("E164_PATTERN", () => {
  it("agrees with the API about what is canonical", () => {
    expect(E164_PATTERN.test("+6281234567890")).toBe(true);
    expect(E164_PATTERN.test("+6591234567")).toBe(true);
    // No leading zero, no missing plus, not too short.
    expect(E164_PATTERN.test("+0812345678")).toBe(false);
    expect(E164_PATTERN.test("081234567890")).toBe(false);
    expect(E164_PATTERN.test("+62123")).toBe(false);
  });
});
