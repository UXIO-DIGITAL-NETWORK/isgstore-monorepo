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
  /** Normal (retail) price in IDR */
  normalPrice: number;
  /** Member-tier price in IDR (UI-only — not yet in backend schema) */
  memberPrice: number;
  /** Gold-tier price in IDR (UI-only — not yet in backend schema) */
  goldPrice: number;
  /** Active/inactive status (UI-only — not yet in backend schema) */
  status: PriceStatus;
}

export type SortOption = "default" | "name-asc" | "price-asc" | "price-desc";
