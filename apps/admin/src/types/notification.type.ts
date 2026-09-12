/**
 * The `type` values the API writes today. Kept as a union of known strings plus
 * `string` so an unrecognised type from a newer API still renders — the bell
 * falls back to a generic glyph rather than dropping the row. A notification
 * the panel cannot name is still a notification the admin should see.
 */
export type NotificationType = "refund.claimed" | "subscription_expiring" | (string & {});

export interface AdminNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  /** Free-form payload written by the raising action — ids the panel can link on. */
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string | null;
}

export interface NotificationListParams {
  page?: number;
  per_page?: number;
  /** `unread` narrows to the badge set; omit for the full feed. */
  filter?: "unread";
}
