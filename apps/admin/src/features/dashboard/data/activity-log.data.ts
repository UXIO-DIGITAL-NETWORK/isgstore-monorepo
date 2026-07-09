import type { ActivityLog } from "../types/dashboard.type";

// Timestamps are computed relative to render/import time (not a fixed
// calendar date) so the feed always shows realistic small offsets —
// 5m/10m/45m/3h/1d ago — no matter when the app actually runs. The UI
// formats these relative-to-now via formatRelativeTime (src/utils/date.ts);
// never bake an "Xm Ago" string into the fixture itself.
const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 60 * 60 * 1000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

export const ACTIVITY_LOG: ActivityLog[] = [
  { id: "act-1", actor: "Randy Galang", action: "Stock Update", role: "Admin", timestamp: minutesAgo(5) },
  { id: "act-2", actor: "Randy Galang", action: "Stock Update", role: "Admin", timestamp: minutesAgo(10) },
  { id: "act-3", actor: "Randy Galang", action: "Stock Update", role: "Admin", timestamp: minutesAgo(45) },
  { id: "act-4", actor: "Randy Galang", action: "Stock Update", role: "Admin", timestamp: hoursAgo(3) },
  { id: "act-5", actor: "Randy Galang", action: "Stock Update", role: "Admin", timestamp: daysAgo(1) },
];
