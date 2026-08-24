/**
 * URL-safe slug from a display name: "Blood Strike" → "blood-strike".
 *
 * Shared rather than private to one dialog: the full Category form derives a
 * slug on name blur, and the quick-create inside Category Provider derives one
 * silently. Two implementations would eventually disagree, and the column is
 * unique server-side — a drift there surfaces as a 422 nobody can explain.
 */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
