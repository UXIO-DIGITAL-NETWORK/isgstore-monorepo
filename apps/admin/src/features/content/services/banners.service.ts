import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toFk, toRowId, unwrapPaginated } from "@/lib/apiMappers";
import type { ApiResponse, PaginatedResponse } from "@/types/api.type";
import type { Announcement, Banner, ContentListParams } from "../types/content.type";

interface BannerApiRow {
  id: number;
  category_id: number | null;
  name: string;
  image_url: string | null;
  link: string | null;
  scope: Banner["scope"];
  created_at: string;
  updated_at: string;
}

interface AnnouncementApiRow {
  id: number;
  category_id: number | null;
  content: string;
  image_url: string | null;
  is_active: boolean;
  scope: Announcement["scope"];
  created_at: string;
  updated_at: string;
}

const toBanner = (row: BannerApiRow): Banner => ({
  id: toRowId(row.id),
  category_id: row.category_id !== null ? toRowId(row.category_id) : undefined,
  name: row.name,
  image_url: row.image_url ?? undefined,
  link: row.link ?? undefined,
  scope: row.scope,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const toAnnouncement = (row: AnnouncementApiRow): Announcement => ({
  id: toRowId(row.id),
  category_id: row.category_id !== null ? toRowId(row.category_id) : undefined,
  content: row.content,
  image_url: row.image_url ?? undefined,
  is_active: Boolean(row.is_active),
  scope: row.scope,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export type BannerInput = Omit<Banner, "id" | "scope" | "image_url" | "created_at" | "updated_at"> & {
  image?: File | null;
};

export type AnnouncementInput = Omit<Announcement, "id" | "scope" | "image_url" | "created_at" | "updated_at"> & {
  image?: File | null;
};

/** Both carry an image upload, so writes are multipart with the PUT spoof. */
const bannerForm = (input: Partial<BannerInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);
  if (input.name !== undefined) form.append("name", input.name);
  if (input.link !== undefined) form.append("link", input.link ?? "");
  // Omitted entirely for a global banner — an empty string would fail the
  // `exists` rule rather than reading as "no category".
  if (input.category_id) form.append("category_id", String(toFk(input.category_id)));
  if (input.image instanceof File) form.append("image_path", input.image);
  return form;
};

const announcementForm = (input: Partial<AnnouncementInput>, method?: "PUT"): FormData => {
  const form = new FormData();
  if (method) form.append("_method", method);
  if (input.content !== undefined) form.append("content", input.content);
  if (input.is_active !== undefined) form.append("is_active", input.is_active ? "1" : "0");
  if (input.category_id) form.append("category_id", String(toFk(input.category_id)));
  if (input.image instanceof File) form.append("image_path", input.image);
  return form;
};

export const bannersService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<Banner>> => {
    const response: ApiResponse<PaginatedResponse<BannerApiRow>> = await api.get(`${API_VERSION}/banners`, { params });
    return unwrapPaginated(response, toBanner);
  },
  getById: async (id: string): Promise<Banner> => {
    const response: ApiResponse<BannerApiRow> = await api.get(`${API_VERSION}/banners/${id}`);
    return toBanner(response.data);
  },
  create: async (input: BannerInput): Promise<Banner> => {
    const response: ApiResponse<BannerApiRow> = await api.post(`${API_VERSION}/banners`, bannerForm(input));
    return toBanner(response.data);
  },
  update: async (id: string, input: Partial<BannerInput>): Promise<Banner> => {
    const response: ApiResponse<BannerApiRow> = await api.post(
      `${API_VERSION}/banners/${id}`,
      bannerForm(input, "PUT"),
    );
    return toBanner(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${API_VERSION}/banners/${id}`);
  },
};

export const announcementsService = {
  list: async (params: ContentListParams = {}): Promise<PaginatedResponse<Announcement>> => {
    const response: ApiResponse<PaginatedResponse<AnnouncementApiRow>> = await api.get(
      `${API_VERSION}/announcements`,
      { params },
    );
    return unwrapPaginated(response, toAnnouncement);
  },
  getById: async (id: string): Promise<Announcement> => {
    const response: ApiResponse<AnnouncementApiRow> = await api.get(`${API_VERSION}/announcements/${id}`);
    return toAnnouncement(response.data);
  },
  create: async (input: AnnouncementInput): Promise<Announcement> => {
    const response: ApiResponse<AnnouncementApiRow> = await api.post(
      `${API_VERSION}/announcements`,
      announcementForm(input),
    );
    return toAnnouncement(response.data);
  },
  update: async (id: string, input: Partial<AnnouncementInput>): Promise<Announcement> => {
    const response: ApiResponse<AnnouncementApiRow> = await api.post(
      `${API_VERSION}/announcements/${id}`,
      announcementForm(input, "PUT"),
    );
    return toAnnouncement(response.data);
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`${API_VERSION}/announcements/${id}`);
  },
};
