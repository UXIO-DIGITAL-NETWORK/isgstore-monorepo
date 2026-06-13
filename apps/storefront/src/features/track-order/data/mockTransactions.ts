import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";
import { TRACK_ORDER_GAMES } from "@/features/track-order/constants/games.constants";

// Shorthand helpers so each row stays concise
const ml_id     = TRACK_ORDER_GAMES.find((g) => g.id === "ml-id")!;
const ml_global = TRACK_ORDER_GAMES.find((g) => g.id === "ml-global")!;
const ff        = TRACK_ORDER_GAMES.find((g) => g.id === "ff-id")!;
const genshin   = TRACK_ORDER_GAMES.find((g) => g.id === "genshin")!;
const pubg      = TRACK_ORDER_GAMES.find((g) => g.id === "pubg")!;

/**
 * Static mock data for the invoice tracker table.
 *
 * TODO: Replace with real API data.
 * Shape maps to Transaction + embedded product/game names from the backend response.
 * Expected endpoint: GET /api/transactions (with optional ?whatsapp= or ?invoice_number= filter)
 */
export const mockTransactions: TrackOrderRow[] = [
  {
    invoiceNumber: "HOM2024051020450001INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "081234567890",
    status: "process",
    gameId: ml_id.id,
    gameName: ml_id.name,
    gameLogo: ml_id.logo,
  },
  {
    invoiceNumber: "HOM2024051020430002INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
    gameId: ff.id,
    gameName: ff.name,
    gameLogo: ff.logo,
  },
  {
    invoiceNumber: "HOM2024051020450003INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "089876543210",
    status: "success",
    gameId: genshin.id,
    gameName: genshin.name,
    gameLogo: genshin.logo,
  },
  {
    invoiceNumber: "HOM2024051020430004INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "089876543210",
    status: "success",
    gameId: pubg.id,
    gameName: pubg.name,
    gameLogo: pubg.logo,
  },
  {
    invoiceNumber: "HOM2024051020450005INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "081234567890",
    status: "success",
    gameId: ml_global.id,
    gameName: ml_global.name,
    gameLogo: ml_global.logo,
  },
  {
    invoiceNumber: "HOM2024051020430006INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
    gameId: ff.id,
    gameName: ff.name,
    gameLogo: ff.logo,
  },
  {
    invoiceNumber: "HOM2024051020450007INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "089876543210",
    status: "success",
    gameId: ml_id.id,
    gameName: ml_id.name,
    gameLogo: ml_id.logo,
  },
  {
    invoiceNumber: "HOM2024051020430008INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "089876543210",
    status: "success",
    gameId: pubg.id,
    gameName: pubg.name,
    gameLogo: pubg.logo,
  },
  {
    invoiceNumber: "HOM2024051020450009INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "081234567890",
    status: "success",
    gameId: genshin.id,
    gameName: genshin.name,
    gameLogo: genshin.logo,
  },
  {
    invoiceNumber: "HOM2024051020430010INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
    gameId: ml_global.id,
    gameName: ml_global.name,
    gameLogo: ml_global.logo,
  },
];
