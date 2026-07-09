import type { StatCardData } from "@/components/common/StatCard";
import { SUMMARY_CARDS } from "../data/summary-cards.data";
import { PAYMENT_GATEWAYS } from "../data/payment-gateways.data";
import { SUPPLIERS } from "../data/suppliers.data";
import type { PaymentGatewayBalance, SupplierBalance } from "../types/financial.type";

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get(...)` call once the backend ships — hooks/UI stay unchanged.
// See system_architecture.md §6.
export const financialService = {
  getSummaryCards: async (): Promise<StatCardData[]> => SUMMARY_CARDS,

  getPaymentGateways: async (): Promise<PaymentGatewayBalance[]> => PAYMENT_GATEWAYS,

  getSuppliers: async (): Promise<SupplierBalance[]> => SUPPLIERS,
};
