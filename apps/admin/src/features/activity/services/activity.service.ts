import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { ActivityListParams, ActivityLog, ActivityType } from "../types/activity.type";

/**
 * Data layer for the admin-wide Activity Log (`GET /v1/activity-logs`). Read-only:
 * activity rows are written by the backend across the app, never from the admin.
 */
const BASE = `${API_VERSION}/activity-logs`;

/** The API row is snake_case; the view type is camelCase with a string id. */
interface ActivityLogApiRow {
  id: number;
  user_id: number | null;
  transaction_id: number | null;
  type: ActivityType | null;
  actor: string;
  role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  message: string;
  created_at: string;
}

const toActivityLog = (row: ActivityLogApiRow): ActivityLog => ({
  id: toRowId(row.id),
  userId: row.user_id,
  transactionId: row.transaction_id,
  type: row.type,
  actor: row.actor,
  role: row.role,
  ipAddress: row.ip_address,
  userAgent: row.user_agent,
  message: row.message,
  createdAt: row.created_at,
});

export const activityService = {
  list: async (params: ActivityListParams = {}): Promise<PaginatedResponse<ActivityLog>> => {
    const response: ApiResponse<PaginatedResponse<ActivityLogApiRow>> = await api.get(BASE, { params });
    return unwrapPaginated(response, toActivityLog);
  },
};
