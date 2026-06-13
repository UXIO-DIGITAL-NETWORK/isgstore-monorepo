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
  /** WhatsApp number — used for search filtering (not shown in table) */
  whatsapp: string;
  status: TrackOrderStatus;
}
