import type { CategoryServerOption } from "../types/categoryServer.type";

export interface ParsedBulkOptions {
  options: CategoryServerOption[];
  /** 1-based number of the first malformed line, or `null` when all parsed. */
  errorLine: number | null;
}

/**
 * Parses the "+ Add Bulk" textarea into Name/Value option rows — one option
 * per line, `Name=Value` (product_requirements.md §4.5, line 235).
 *
 * The reference's helper text asserts "Bulk must be in the correct format"
 * but never shows the format; its placeholder is lorem ipsum, like every
 * other placeholder in this feature's references. The format is a confirmed
 * decision, not something read off the design.
 *
 * All-or-nothing: one bad line rejects the whole paste. Appending the valid
 * rows and silently dropping the rest would leave the operator unable to tell
 * what actually landed.
 */
export function parseBulkOptions(text: string): ParsedBulkOptions {
  const options: CategoryServerOption[] = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    // Blank lines are skipped but still counted, so a reported line number
    // matches what the operator sees in the textarea.
    if (!line) continue;

    // "=" separates, so a name may contain commas — the Genshin fixture has
    // "TW, HK, MO". The FIRST one wins; values are slugs and never contain it.
    const separator = line.indexOf("=");
    const name = separator === -1 ? "" : line.slice(0, separator).trim();
    const value = separator === -1 ? "" : line.slice(separator + 1).trim();

    if (!name || !value) return { options: [], errorLine: index + 1 };

    options.push({ name, value });
  }

  return { options, errorLine: null };
}
