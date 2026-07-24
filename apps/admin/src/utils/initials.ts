/**
 * Avatar fallback label — the first letter of the first two words, uppercased
 * ("Randy Galang" -> "RG"). Promoted from the transaction column files when
 * the Activity Log modal became a third caller.
 */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
