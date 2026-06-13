import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";

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
  },
  {
    invoiceNumber: "HOM2024051020430002INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020450003INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "089876543210",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020430004INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "089876543210",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020450005INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "081234567890",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020430006INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020450007INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "089876543210",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020430008INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "089876543210",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020450009INV",
    createdAt: "2026-05-10T20:45:00",
    service: "10 + 1 Diamonds",
    amount: 2783,
    whatsapp: "081234567890",
    status: "success",
  },
  {
    invoiceNumber: "HOM2024051020430010INV",
    createdAt: "2026-05-10T20:43:00",
    service: "20 + 2 Diamonds",
    amount: 5566,
    whatsapp: "081234567890",
    status: "success",
  },
];
