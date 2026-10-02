import { useAuthStore } from "@/store/useAuthStore";

import { ok, strParam } from "../envelope";
import { MOCK_BALANCE_CHANNEL, MOCK_MEMBERSHIP_PLANS, MOCK_PAYMENT_CHANNELS } from "../data/commerce";
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_BANNERS,
  MOCK_FLASH_SALE,
  MOCK_PROMOS,
  MOCK_SETTINGS,
  MOCK_TESTIMONIALS,
  leaderboardFor,
} from "../data/home";
import type { MockHandler, MockRequest } from "../types";

interface PromoBody {
  code?: string;
  amount?: number;
}

function validatePromo(request: MockRequest) {
  const body = (request.body ?? {}) as PromoBody;
  const code = (body.code ?? "").trim().toUpperCase();
  const amount = typeof body.amount === "number" ? body.amount : 0;
  const promo = MOCK_PROMOS.find((candidate) => candidate.code === code);

  if (!promo) {
    return ok({ valid: false, discount_amount: 0 }, "Kode promo tidak valid.");
  }

  const raw =
    promo.type === "percentage"
      ? Math.round((amount * promo.value) / 100)
      : promo.value;
  const discount = Math.min(raw, promo.max_discount ?? raw);

  return ok(
    { valid: true, code: promo.code, name: promo.name, discount_amount: discount },
    "Kode promo berhasil diterapkan.",
  );
}

export const storefrontHandlers: MockHandler[] = [
  { method: "GET", pattern: /^\/v1\/storefront\/banners$/, resolve: () => ok(MOCK_BANNERS) },
  { method: "GET", pattern: /^\/v1\/storefront\/announcements$/, resolve: () => ok(MOCK_ANNOUNCEMENTS) },
  { method: "GET", pattern: /^\/v1\/storefront\/testimonials$/, resolve: () => ok(MOCK_TESTIMONIALS) },
  { method: "GET", pattern: /^\/v1\/storefront\/flash-sale$/, resolve: () => ok(MOCK_FLASH_SALE) },
  { method: "GET", pattern: /^\/v1\/storefront\/settings$/, resolve: () => ok(MOCK_SETTINGS) },
  { method: "GET", pattern: /^\/v1\/storefront\/promos$/, resolve: () => ok(MOCK_PROMOS) },
  { method: "POST", pattern: /^\/v1\/storefront\/promos\/validate$/, resolve: validatePromo },
  { method: "GET", pattern: /^\/v1\/storefront\/membership-plans$/, resolve: () => ok(MOCK_MEMBERSHIP_PLANS) },
  {
    method: "GET",
    pattern: /^\/v1\/storefront\/leaderboard$/,
    resolve: ({ params }) => ok(leaderboardFor(strParam(params.period) || "today")),
  },
  {
    method: "GET",
    pattern: /^\/v1\/storefront\/payment-channels$/,
    resolve: () => {
      // The wallet channel only exists for a signed-in member, exactly as the
      // API omits it for guests.
      const authed = Boolean(useAuthStore.getState().token);
      const channels = authed
        ? [...MOCK_PAYMENT_CHANNELS, MOCK_BALANCE_CHANNEL]
        : MOCK_PAYMENT_CHANNELS;
      return ok({ channels });
    },
  },
];
