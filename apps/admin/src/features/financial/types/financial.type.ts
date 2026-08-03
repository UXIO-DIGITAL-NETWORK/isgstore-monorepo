/**
 * Feature-local per product_requirements.md §6 — promote to src/types/models
 * only if another feature (e.g. Transaction) needs these too.
 */
/**
 * Balances are nullable: only providers with a live balance integration
 * (Digiflazz, Monetapay) report a figure, and "we could not read a balance"
 * has to stay distinguishable from "the balance is zero".
 */
export type PaymentGatewayBalance = {
  id: string;
  name: string;
  logoUrl: string;
  activeBalance: number | null;
  heldBalance: number | null;
};

export type SupplierBalance = {
  id: string;
  name: string;
  logoUrl: string;
  balance: number | null;
};
