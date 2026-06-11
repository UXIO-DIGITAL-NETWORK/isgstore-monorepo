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
  adminFee: number; // TODO: replace with backend-provided value
  total: number;
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
