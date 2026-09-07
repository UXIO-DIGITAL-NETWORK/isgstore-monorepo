import { describe, it, expect } from "vitest";

import { initials } from "./initials";

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Randy Galang")).toBe("RG");
    expect(initials("Rachel Ayu Kusuma")).toBe("RA");
  });

  it("handles a single-word name", () => {
    expect(initials("System")).toBe("S");
  });

  it("ignores repeated spaces rather than emitting undefined", () => {
    expect(initials("Sinta  Dewi")).toBe("SD");
  });
});
