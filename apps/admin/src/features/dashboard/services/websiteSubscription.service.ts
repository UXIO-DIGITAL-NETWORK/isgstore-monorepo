import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/**
 * This site's own subscription to the platform.
 *
 * Every failure mode is a status, never an error — the card renders on every
 * admin page, so the endpoint always answers 200.
 */
export type WebsiteSubscriptionStatus =
  | "active"
  | "expiring_soon"
  | "expired"
  /** Never subscribed. The CTA still carries a link — that is the point. */
  | "none"
  /** No default merchant or no matching service; the card renders nothing. */
  | "unconfigured";

export interface WebsiteSubscription {
  status: WebsiteSubscriptionStatus;
  service: { id: number; code: string; name: string } | null;
  ends_at: string | null;
  days_remaining: number | null;
  /** Deep link into Uxiolabs Pay; the client signs in there. */
  checkout_url: string | null;
}

export const websiteSubscriptionService = {
  get: async (): Promise<WebsiteSubscription> => {
    const response: ApiResponse<WebsiteSubscription> = await api.get(`${API_VERSION}/website-subscription`);
    return response.data;
  },
};
