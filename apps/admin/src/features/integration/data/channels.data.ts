import type { IntegrationChannel } from "../types/integration.type";

/**
 * 6 channels — 3 supplier, 2 payment_gateway, 1 whatsapp_gateway, 0
 * email_gateway (Email Gateway stays a valid filter category with zero
 * channels, per product_requirements.md §4.4) — 5 connected / 1
 * disconnected, matching the overview stat-card counts.
 *
 * One entry is inferred, not confirmed by any reference (flagged in this
 * build's logs/feature-changes entry too):
 * - Monetapay is added as the 2nd payment gateway alongside UxioPay — a
 *   cross-project assumption (the consumer platform's established
 *   gateway), not confirmed against this admin's own scope.
 */
export const CHANNELS: IntegrationChannel[] = [
  {
    id: "uxiolabs",
    provider: "uxiolabs",
    type: "supplier",
    name: "Uxiolabs",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "connected",
    balance: 6324067,
    mode: "production",
    last_ping_at: "2026-07-10T08:12:00.000Z",
    created_at: "2025-01-10T00:00:00.000Z",
    updated_at: "2026-07-10T08:12:00.000Z",
  },
  {
    id: "zelpoint",
    type: "supplier",
    name: "Zelpoint",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "connected",
    balance: 2850750,
    last_ping_at: "2026-07-10T08:10:00.000Z",
    created_at: "2025-03-02T00:00:00.000Z",
    updated_at: "2026-07-10T08:10:00.000Z",
  },
  {
    id: "topupkuy",
    type: "supplier",
    name: "Topupkuy",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "connected",
    balance: 1975300,
    last_ping_at: "2026-07-10T08:09:00.000Z",
    created_at: "2025-03-02T00:00:00.000Z",
    updated_at: "2026-07-10T08:09:00.000Z",
  },
  {
    id: "uxiopay",
    type: "payment_gateway",
    name: "UxioPay",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "connected",
    balance: 18450000,
    last_ping_at: "2026-07-10T08:13:00.000Z",
    created_at: "2024-11-05T00:00:00.000Z",
    updated_at: "2026-07-10T08:13:00.000Z",
  },
  {
    id: "monetapay",
    type: "payment_gateway",
    name: "Payment Gateway",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "disconnected",
    balance: 9320000,
    last_ping_at: "2026-07-10T05:58:00.000Z",
    created_at: "2025-06-18T00:00:00.000Z",
    updated_at: "2026-07-10T05:58:00.000Z",
  },
  {
    id: "wablas",
    type: "whatsapp_gateway",
    name: "Wablas",
    logo_url: "",
    currency_config: "Indonesia Rupiah (Rp) IDR - Rp 1",
    connection_status: "connected",
    balance: 1250000,
    last_ping_at: "2026-07-10T08:11:00.000Z",
    created_at: "2025-02-14T00:00:00.000Z",
    updated_at: "2026-07-10T08:11:00.000Z",
  },
];
