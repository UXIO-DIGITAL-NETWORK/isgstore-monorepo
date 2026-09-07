export type PriceStatus = "active" | "inactive";

export interface PriceListItem {
  /** Row ID — shown as "ID: {id}" sub-label beneath the service name */
  id: number;
  /** Package/service label — e.g. "100 (92+8) Diamond" */
  serviceName: string;
  /** Unique game identifier — used for category filter */
  gameId: string;
  /** Display name of the game — e.g. "Mobile Legends" */
  gameName: string;
  /** Imported logo image URL for the game cell */
  gameLogo: string;
  /** Game server / publisher region — e.g. "Indonesia", "moHoyo" */
  gameRegion: string;
  /** What a visitor pays today — the default (free) plan's price. */
  normalPrice: number;
  /**
   * One entry per active membership plan, in the admin's order. The table grows
   * its columns from this rather than from a fixed set, so adding a plan needs
   * no frontend release.
   */
  tiers: PriceListTier[];
  status: PriceStatus;
}

export interface PriceListTier {
  planId: number;
  planCode: string;
  planName: string;
  isDefault: boolean;
  /** The highest tier hides its price; `price` is null when it does. */
  isHidden: boolean;
  price: number | null;
}

export type SortOption = "default" | "name-asc" | "price-asc" | "price-desc";
