/**
 * Activity Log — the admin-wide audit feed served by `GET /v1/activity-logs`
 * (`ActivityLogResource`). One row per logged action across all users; `actor`
 * is `"System"` when no user is attached, and `type` is null for legacy rows
 * written before the classification column existed.
 */
export type ActivityType = "login" | "membership" | "transaction" | "security" | "verification" | "failed";

export interface ActivityLog {
  /** Normalized to a string for `DataTable`/column keys via `toRowId`. */
  id: string;
  userId: number | null;
  transactionId: number | null;
  type: ActivityType | null;
  actor: string;
  role: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  message: string;
  createdAt: string;
}

export interface ActivityListParams {
  search?: string;
  page?: number;
  per_page?: number;
}
