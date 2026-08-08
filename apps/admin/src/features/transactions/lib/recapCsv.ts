import type { TransactionRecap } from "../types/transaction.type";

/** Quotes a CSV cell only when it contains a comma, quote, or newline. */
function cell(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/**
 * Serialises a recap into a CSV string (label, count, revenue) with a totals
 * row. Kept client-side so the download needs no extra endpoint.
 */
export function recapToCsv(recap: TransactionRecap): string {
  const header = ["Label", "Count", "Revenue"];
  const rows = recap.rows.map((row) => [cell(row.label), cell(row.count), cell(row.revenue)].join(","));
  const totals = [cell("Total"), cell(recap.totals.count), cell(recap.totals.revenue)].join(",");
  return [header.join(","), ...rows, totals].join("\n");
}
