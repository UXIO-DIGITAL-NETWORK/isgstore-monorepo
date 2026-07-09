/**
 * Feature-local per product_requirements.md §6 — promote to src/types/models
 * only if another feature (e.g. Transaction) needs these too.
 */
export type PaymentGatewayBalance = {
  id: string;
  name: string;
  logoUrl: string;
  activeBalance: number;
  heldBalance: number;
};

export type SupplierBalance = {
  id: string;
  name: string;
  logoUrl: string;
  balance: number;
};
