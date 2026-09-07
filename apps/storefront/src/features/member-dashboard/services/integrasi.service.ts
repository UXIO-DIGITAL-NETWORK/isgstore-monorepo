import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

export interface ApiCredentialModel {
  id: number;
  name: string;
  /** Prefix plus bullets. The real key is unrecoverable — see `secret`. */
  masked_key: string;
  callback_url: string | null;
  whitelist_ips: string[];
  last_used_at: string | null;
  created_at: string;
}

export interface ApiCredentialListResponse {
  credentials: ApiCredentialModel[];
  callback_url: string | null;
  whitelist_ips: string[];
}

/** Returned only by create and regenerate, and only once. */
export type IssuedCredential = ApiCredentialModel & { secret: string };

export const integrasiService = {
  list: async (): Promise<ApiResponse<ApiCredentialListResponse>> =>
    await api.get(`${API_VERSION}/me/api-credentials`),

  create: async (name = "Default"): Promise<ApiResponse<IssuedCredential>> =>
    await api.post(`${API_VERSION}/me/api-credentials`, { name }),

  /** Revokes the current key and issues a replacement in one call. */
  regenerate: async (id: number): Promise<ApiResponse<IssuedCredential>> =>
    await api.post(`${API_VERSION}/me/api-credentials/${id}/regenerate`),

  update: async (
    id: number,
    input: { callback_url?: string | null; whitelist_ips?: string[] },
  ): Promise<ApiResponse<ApiCredentialModel>> => await api.put(`${API_VERSION}/me/api-credentials/${id}`, input),
};
