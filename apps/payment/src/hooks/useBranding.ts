import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";

/**
 * The site's own name, for the panels that belong to the client.
 *
 * This app used to hardcode "Uxiolabs" in its chrome, which is kita's brand,
 * not the client's — their staff open this every day to run their own business.
 * The name now comes from the same public settings row the storefront reads, so
 * one deployment says "ISG Store" and the next says whatever it is called.
 *
 * Deliberately unauthenticated (`/storefront/settings` returns only rows marked
 * public) so the login screen can be branded too — which is the first place
 * anyone sees the panel.
 *
 * The fallback is a real name rather than a blank: a header that flickers empty
 * on every cold load looks broken.
 */
type PublicSettings = Record<string, string | number | boolean | unknown[] | null>;

const FALLBACK = "ISG Store";

export function useBranding(): { siteName: string } {
  const { data } = useQuery({
    queryKey: ["settings", "public"],
    queryFn: async (): Promise<{ data: PublicSettings }> =>
      await api.get(`${API_VERSION}/storefront/settings`),
    // Branding changes about once a year; refetching it per mount is noise.
    staleTime: Infinity,
    retry: false,
  });

  const raw = data?.data?.site_name;
  const siteName = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : FALLBACK;

  return { siteName };
}
