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
  | "unconfigured"
  /**
   * Switched off from the Uxio Hub. Outranks every date — the storefront is
   * already refusing customers, whatever `ends_at` says.
   */
  | "suspended";

/**
 * One service the Hub marked as governing the site's term.
 *
 * `HubPlanItem` publishes the plan; only a `governs_licence` line can move
 * `sites.licence_ends_at` — the licence itself, plus any add-on stacked on it.
 */
export interface GoverningService {
  service_code: string;
  service_name: string;
  /** `billed` | `one_time` | `prepaid`. */
  billing_mode: string;
  duration_days: number;
  governs_licence: boolean;
  /** Bought outright — nothing to count down to. */
  lifetime: boolean;
  /** Paid up to for this service. Null when `lifetime`. */
  active_until: string | null;
}

export interface WebsiteSubscription {
  status: WebsiteSubscriptionStatus;
  service: { id: number; code: string; name: string } | null;
  ends_at: string | null;
  days_remaining: number | null;
  /**
   * Paid once, no end date. `ends_at` is null for it too — so without this flag
   * a licence bought outright is indistinguishable from one that never existed.
   * Optional: an older API omits it.
   */
  lifetime?: boolean;
  /**
   * The services that keep the site up, each with its own duration, so "up until
   * X" can be read with WHAT buys it. Optional — empty on a standalone site.
   */
  services?: GoverningService[];
  /** Deep link into the site's payment panel; the client signs in there. */
  checkout_url: string | null;
  /** Whether the public side is actually up. Optional — an older API omits it. */
  is_serving?: boolean;
  suspend_reason?: string | null;
}

export const websiteSubscriptionService = {
  get: async (): Promise<WebsiteSubscription> => {
    const response: ApiResponse<WebsiteSubscription> = await api.get(`${API_VERSION}/website-subscription`);
    return response.data;
  },
};
