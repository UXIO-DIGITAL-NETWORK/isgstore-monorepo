import { describe, it, expect } from "vitest";
import { parseBulkOptions } from "../utils/parseBulkOptions";

/**
 * Bulk option parser for the Add Category Server form's "+ Add Bulk" panel.
 * The reference's helper text asserts "Bulk must be in the correct format"
 * without ever showing the format (its placeholder is lorem ipsum, like every
 * other placeholder in this feature's references). Confirmed format: one
 * option per line, `Name,Value`.
 */
describe("parseBulkOptions", () => {
  it("parses one Name,Value pair per line", () => {
    const result = parseBulkOptions("ASIA,asia\nEUROPE,europe");

    expect(result.errorLine).toBeNull();
    expect(result.options).toEqual([
      { name: "ASIA", value: "asia" },
      { name: "EUROPE", value: "europe" },
    ]);
  });

  it("trims surrounding whitespace on both sides of the comma", () => {
    const result = parseBulkOptions("  ASIA ,  asia  ");

    expect(result.errorLine).toBeNull();
    expect(result.options).toEqual([{ name: "ASIA", value: "asia" }]);
  });

  it("skips blank and whitespace-only lines", () => {
    const result = parseBulkOptions("ASIA,asia\n\n   \nEUROPE,europe\n");

    expect(result.errorLine).toBeNull();
    expect(result.options).toHaveLength(2);
  });

  it("handles CRLF line endings, which a paste from Windows carries", () => {
    const result = parseBulkOptions("ASIA,asia\r\nEUROPE,europe");

    expect(result.errorLine).toBeNull();
    expect(result.options).toEqual([
      { name: "ASIA", value: "asia" },
      { name: "EUROPE", value: "europe" },
    ]);
  });

  it("splits on the LAST comma, so a name may contain commas", () => {
    // The real Genshin fixture has an option named "TW, HK, MO". Splitting on
    // the first comma would mangle it; values are slugs and never contain one.
    const result = parseBulkOptions("TW, HK, MO,os_cht");

    expect(result.errorLine).toBeNull();
    expect(result.options).toEqual([{ name: "TW, HK, MO", value: "os_cht" }]);
  });

  it("rejects a line with no comma, reporting its 1-based number", () => {
    const result = parseBulkOptions("ASIA,asia\nEUROPE\nAMERICA,america");

    expect(result.errorLine).toBe(2);
    expect(result.options).toEqual([]);
  });

  it("rejects an empty name or an empty value", () => {
    expect(parseBulkOptions(",asia").errorLine).toBe(1);
    expect(parseBulkOptions("ASIA,").errorLine).toBe(1);
    expect(parseBulkOptions("ASIA,asia\n  ,europe").errorLine).toBe(2);
  });

  it("counts blank lines when numbering the offending line", () => {
    // The operator sees the textarea's real line numbers, so a skipped blank
    // line must not shift the number reported back to them.
    const result = parseBulkOptions("ASIA,asia\n\nEUROPE");

    expect(result.errorLine).toBe(3);
  });

  it("returns no options for empty input, without an error", () => {
    expect(parseBulkOptions("")).toEqual({ options: [], errorLine: null });
    expect(parseBulkOptions("   \n  ")).toEqual({ options: [], errorLine: null });
  });
});
