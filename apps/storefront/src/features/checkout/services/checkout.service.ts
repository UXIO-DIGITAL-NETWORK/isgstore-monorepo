import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type { GameDetailModel } from "@/types/models/game.model";
import type { GameProductsResponse, PaymentChannelsResponse } from "@/types/models/product.model";
import type {
  CheckoutPayload,
  CheckoutResult,
  GameReviewsResponse,
  ValidateGameIdResult,
} from "../types/checkout.type";

export const checkoutService = {
  /** Game detail incl. the order-form schema that drives the account step. */
  game: async (slug: string): Promise<ApiResponse<GameDetailModel>> => {
    return await api.get(`${API_VERSION}/games/${slug}`);
  },

  /**
   * Denominations, already priced for the caller — the API resolves the role
   * ladder, so there is no price to pick from on the client.
   */
  products: async (slug: string): Promise<ApiResponse<GameProductsResponse>> => {
    return await api.get(`${API_VERSION}/games/${slug}/products`);
  },

  /**
   * Active channels; `balance` is only included for a signed-in member.
   *
   * Moved under `/storefront` when the admin gained CRUD on
   * `/v1/payment-channels` — the two cannot share a URI, and the admin route
   * is auth-gated, so the old path would 401 every anonymous checkout.
   */
  paymentChannels: async (): Promise<ApiResponse<PaymentChannelsResponse>> => {
    return await api.get(`${API_VERSION}/storefront/payment-channels`);
  },

  reviews: async (slug: string): Promise<ApiResponse<GameReviewsResponse>> => {
    return await api.get(`${API_VERSION}/games/${slug}/reviews`, { params: { per_page: 20 } });
  },

  /**
   * Nickname lookup. Always resolves — "no nickname available" is a valid
   * answer, so this can never block a purchase.
   */
  validateGameId: async (
    slug: string,
    payload: { target_uid: string; target_server?: string },
  ): Promise<ApiResponse<ValidateGameIdResult>> => {
    return await api.post(`${API_VERSION}/games/${slug}/validate-id`, payload);
  },

  checkout: async (payload: CheckoutPayload): Promise<ApiResponse<CheckoutResult>> => {
    return await api.post(`${API_VERSION}/checkout`, payload);
  },
};
