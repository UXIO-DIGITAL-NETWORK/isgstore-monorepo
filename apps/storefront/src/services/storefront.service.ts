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
  /**
   * One entry per active membership plan, in the admin's own order. Replaces
   * the fixed normal/member/gold triple — "gold" used to be `price_vip`, which
   * was already a different plan's price.
   */
  tiers: PriceListTier[];
  status: "active" | "inactive";
  /** Slots left today (null = no ceiling), and whether there are none. */
  stock_left: number | null;
  is_sold_out: boolean;
}

export interface PriceListTier {
  membership_plan_id: number;
  plan_code: string;
  plan_name: string;
  is_default: boolean;
  /** The top tier withholds its price — it is the reason to subscribe. */
  is_hidden: boolean;
  price: number | null;
}

export interface BannerModel {
  id: number;
  name: string;
  link: string | null;
  image_url: string;
}

/** One row of `GET /v1/storefront/announcements` — short operational notices. */
export interface AnnouncementModel {
  id: number;
  content: string;
  image_url: string | null;
}

/** One row of `GET /v1/storefront/testimonials` — editorial, admin-authored. */
export interface TestimonialModel {
  id: number;
  author: string;
  title: string | null;
  avatar_url: string | null;
  content: string;
  rating: number | null;
  game: string | null;
  is_featured: boolean;
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

  announcements: async (): Promise<ApiResponse<AnnouncementModel[]>> => {
    return await api.get(`${API_VERSION}/storefront/announcements`);
  },

  testimonials: async (): Promise<ApiResponse<TestimonialModel[]>> => {
    return await api.get(`${API_VERSION}/storefront/testimonials`);
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
