import mlThumbnail from "@/assets/images/games/games_1.png";
import type { PendingOrder } from "@/store/useCheckoutStore";

// Static fallback used on direct visit / page refresh when the Zustand store is empty
export function buildMockOrder(invoiceNumber: string): PendingOrder {
  return {
    invoiceNumber,
    gameName: "Mobile Legend",
    gameRegion: "Indonesia",
    gameThumbnail: mlThumbnail,
    packageLabel: "5 Diamond",
    userId: "337850017",
    serverId: "9423",
    username: "Ramonezz",
    paymentName: "QRIS",
    price: 1015,
    adminFee: 43,
    total: 1058,
    createdAt: Date.now(),
  };
}
