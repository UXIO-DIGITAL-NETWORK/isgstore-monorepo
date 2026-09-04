import { api } from "@/lib/axios";
import { API_VERSION } from "@/config/env";
import { toRowId } from "@/lib/apiMappers";
import type { StatCardData } from "@/components/common/StatCard";
import type { ApiResponse } from "@/types/api.type";
import type { PaymentGatewayBalance, SupplierBalance } from "../types/financial.type";

interface SummaryCardApiRow {
  key: "credit" | "debit" | "profit";
  value: number;
  delta_pct: number | null;
  direction: "up" | "down" | null;
  caption: string;
}

interface PaymentGatewayApiRow {
  id: string;
  name: string;
  active_balance: number | null;
  held_balance: number | null;
}

interface SupplierApiRow {
  id: number;
  name: string;
  balance: number | null;
}

/**
 * The API returns a stable `key` per card and leaves presentation to the
 * client, so the human label lives here rather than being sent down as copy.
 */
const CARD_LABELS: Record<SummaryCardApiRow["key"], string> = {
  credit: "Total Credit",
  debit: "Total Debit",
  profit: "Profit",
};

/**
 * No logo is stored for a gateway or supplier. Every fixture already used an
 * empty string and `Image` falls back on its own, so this stays empty rather
 * than inventing a URL that would 404.
 */
const NO_LOGO = "";

const toStatCard = (row: SummaryCardApiRow): StatCardData => ({
  id: row.key,
  label: CARD_LABELS[row.key] ?? row.key,
  value: row.value,
  // Both are omitted together: with no prior month to compare against the API
  // sends nulls, and StatCard renders the trend pill only when both are set.
  ...(row.delta_pct !== null && row.direction !== null
    ? { deltaPct: row.delta_pct, direction: row.direction }
    : {}),
  caption: row.caption,
});

export const financialService = {
  getSummaryCards: async (): Promise<StatCardData[]> => {
    const response: ApiResponse<SummaryCardApiRow[]> = await api.get(`${API_VERSION}/financial/summary`);
    return response.data.map(toStatCard);
  },

  getPaymentGateways: async (): Promise<PaymentGatewayBalance[]> => {
    const response: ApiResponse<PaymentGatewayApiRow[]> = await api.get(`${API_VERSION}/financial/payment-gateways`);
    return response.data.map((row) => ({
      id: row.id,
      name: row.name,
      logoUrl: NO_LOGO,
      activeBalance: row.active_balance,
      heldBalance: row.held_balance,
    }));
  },

  getSuppliers: async (): Promise<SupplierBalance[]> => {
    const response: ApiResponse<SupplierApiRow[]> = await api.get(`${API_VERSION}/financial/suppliers`);
    return response.data.map((row) => ({
      id: toRowId(row.id),
      name: row.name,
      logoUrl: NO_LOGO,
      // Only Uxiolabs has a live balance integration; the rest genuinely have
      // no figure, which is different from a balance of zero.
      balance: row.balance,
    }));
  },
};
