/**
 * Feature-local per product_requirements.md §6 — deliberately separate from
 * financial's PaymentGatewayBalance/SupplierBalance (camelCase, money
 * concern). IntegrationChannel is connectivity, not money: some channel
 * names overlap with financial's fixtures (e.g. "UxioPay"), that's the same
 * real-world channel viewed through a different concern, not a shared type.
 */
export type ChannelType = "supplier" | "payment_gateway" | "whatsapp_gateway" | "email_gateway";

export type ConnectionStatus = "connected" | "disconnected";

export type IntegrationChannel = {
  id: string;
  /** Stable provider slug used to target the manage endpoints (= id). */
  provider?: string;
  type: ChannelType;
  name: string;
  logo_url?: string;
  currency_config?: string;
  connection_status: ConnectionStatus;
  balance?: number;
  mode?: string;
  last_ping_at?: string;
  created_at: string;
  updated_at: string;
};

/** One editable credential field in a provider's schema. */
export type IntegrationChannelField = {
  key: string;
  label: string;
  type: "text" | "password" | "boolean";
  secret: boolean;
  /** Masked (secret) or actual (non-secret) current value; null when unset. */
  value: string | boolean | null;
};

/** Detail view of one channel (View details + edit-form source). */
export type IntegrationChannelDetails = {
  id: string;
  provider: string;
  name: string;
  type: ChannelType;
  connection_status: ConnectionStatus;
  balance: number | null;
  mode: string | null;
  endpoint: string | null;
  last_ping_at: string;
  fields: IntegrationChannelField[];
};

/** Edit-connection payload — field key → new value (blank secret = keep). */
export type UpdateChannelPayload = Record<string, string | boolean>;
