import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { AdminNotification, NotificationListParams } from "@/types/notification.type";

/**
 * Unprefixed on purpose. The same controller serves three route groups and
 * scopes every query to the caller, so the admin's feed is plain `/v1/...`
 * while the payment page reads `/v1/payment-internal/...` and a client reads
 * `/v1/payment-admin/...`. The group decides who may ask; it never decides
 * whose rows come back.
 */
const BASE = `${API_VERSION}/notifications`;

interface NotificationApiRow {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
}

const mapRow = (row: NotificationApiRow): AdminNotification => ({
  id: row.id,
  type: row.type,
  title: row.title,
  message: row.message,
  data: row.data,
  isRead: row.is_read,
  readAt: row.read_at,
  createdAt: row.created_at,
});

export const notificationsService = {
  list: async (params: NotificationListParams = {}): Promise<PaginatedResponse<AdminNotification>> => {
    const response = await api.get(BASE, { params });

    return unwrapPaginated<NotificationApiRow, AdminNotification>(response, mapRow);
  },

  unreadCount: async (): Promise<number> => {
    const res: ApiResponse<{ unread_count: number }> = await api.get(`${BASE}/unread-count`);
    return res.data.unread_count;
  },

  markRead: async (id: number): Promise<void> => {
    await api.post(`${BASE}/${id}/read`, {});
  },

  markAllRead: async (): Promise<void> => {
    await api.post(`${BASE}/read-all`, {});
  },
};
