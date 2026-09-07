export type TrackOrderStatus = "process" | "success" | "failed";

export interface TrackOrderRow {
  /** Invoice number — e.g. "HOM20240510204500INV" */
  invoiceNumber: string;
  /** ISO date string or Date object */
  createdAt: string | Date;
  /** Human-readable package/service label — e.g. "10 + 1 Diamonds" */
  service: string;
  /** Total amount in IDR */
  amount: number;
  /** "Biaya Admin" — the payment method's fee; 0 when not applicable. */
  adminFee: number;
  /** WhatsApp number — used for search filtering (not shown in table) */
  whatsapp: string;
  status: TrackOrderStatus;
  /** Unique game identifier, as returned by the games API. */
  gameId: string;
  /** Display name of the game — e.g. "Mobile Legends" */
  gameName: string;
  /** Imported logo image URL for the game */
  gameLogo: string;
}
