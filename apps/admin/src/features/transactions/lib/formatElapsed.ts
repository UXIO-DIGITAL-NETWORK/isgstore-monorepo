/**
 * Compact elapsed-duration badge text next to the resolved timestamp in the
 * Time column, e.g. "1m 23s" / "1h 5m" (product_requirements.md §4.3 —
 * exact unit format unresolved without Figma access this session, so kept
 * simple: minutes+seconds under an hour, hours+minutes at/above an hour).
 */
export function formatElapsed(totalSeconds: number): string {
  if (totalSeconds < 3600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
