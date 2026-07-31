import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse, Paginated, PaginatedResponse } from "@/types/api.type";
import type { GameModel } from "@/types/models/game.model";
import type { TransactionSummaryModel } from "@/types/models/transaction.model";

export interface PriceListRow {
  id: number;
  service_name: string;
  code: string;
  game_id: number;
  game_name: string | null;
  game_slug: string | null;
  game_region: string | null;
  game_logo_url: string | null;
  normal_price: number;
  member_price: number;
  gold_price: number;
  status: "active" | "inactive";
}

export interface BannerModel {
  id: number;
  name: string;
  link: string | null;
  image_url: string;
}

export interface LeaderboardEntryModel {
  rank: number;
  player_name: string;
  total_amount: number;
  total_orders: number;
}

/**
 * Read-only endpoints shared by more than one feature (the homepage grid, the
 * navbar search, the price list, order tracking).
 *
 * Lives in `src/services/` rather than inside a feature because several
 * features consume it, and the golden rule forbids one feature importing
 * another.
 */
export const storefrontService = {
  games: async (params?: {
    search?: string;
    sort?: "name" | "popular";
    per_page?: number;
  }): Promise<PaginatedResponse<GameModel>> => {
    return await api.get(`${API_VERSION}/games`, { params });
  },

  priceList: async (params: {
    search?: string;
    /** Game slug or code — the API resolves both. */
    game?: string;
    sort?: string;
    per_page?: number;
    page?: number;
  }): Promise<ApiResponse<Paginated<PriceListRow>>> => {
    return await api.get(`${API_VERSION}/price-list`, { params });
  },

  banners: async (): Promise<ApiResponse<BannerModel[]>> => {
    return await api.get(`${API_VERSION}/storefront/banners`);
  },

  leaderboard: async (period: string): Promise<
    ApiResponse<{ period: string; entries: LeaderboardEntryModel[] }>
  > => {
    return await api.get(`${API_VERSION}/storefront/leaderboard`, { params: { period } });
  },

  trackOrders: async (query: string): Promise<ApiResponse<TransactionSummaryModel[]>> => {
    return await api.get(`${API_VERSION}/orders/track`, { params: { query } });
  },
};
