import { useQuery } from "@tanstack/react-query";

import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/**
 * Public site settings as a flat `{key: value}` map.
 *
 * Only keys the admin has explicitly marked public are returned, so this can
 * be fetched anonymously without leaking operational configuration. Values
 * arrive already coerced to the type the setting declares.
 */
export type PublicSettings = Record<string, string | number | boolean | unknown[] | null>;

export const useSettingsQuery = () =>
  useQuery({
    queryKey: ["settings", "public"],
    queryFn: async (): Promise<ApiResponse<PublicSettings>> => await api.get(`${API_VERSION}/storefront/settings`),
    // Settings change rarely and are read on several pages; refetching them on
    // every mount would be pure noise.
    staleTime: 5 * 60 * 1000,
  });
