import { create } from "zustand";

export interface PendingOrder {
  invoiceNumber: string;
  gameName: string;
  gameRegion: string;
  gameThumbnail: string;
  packageLabel: string;
  userId: string;
  serverId: string;
  username: string;
  paymentName: string;
  price: number;
  /** "Biaya Admin" — the payment method's fee. */
  adminFee: number;
  total: number;
  /** Points this order earns. Optional: seeded at checkout, then confirmed by the invoice query. */
  pointsEarned?: number;
  /** True while the figure is still a projection rather than a granted amount. */
  pointsAreEstimate?: boolean;
  /** False for a guest order — it earns nothing, so no number may be shown as a promise. */
  pointsEligible?: boolean;
  createdAt: number;
}

interface CheckoutState {
  pendingOrder: PendingOrder | null;
  setPendingOrder: (order: PendingOrder) => void;
  clearPendingOrder: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  pendingOrder: null,
  setPendingOrder: (order) => set({ pendingOrder: order }),
  clearPendingOrder: () => set({ pendingOrder: null }),
}));
