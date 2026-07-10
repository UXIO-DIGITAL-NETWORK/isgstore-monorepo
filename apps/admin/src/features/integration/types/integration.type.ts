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
  type: ChannelType;
  name: string;
  logo_url?: string;
  currency_config?: string;
  connection_status: ConnectionStatus;
  balance?: number;
  last_ping_at?: string;
  created_at: string;
  updated_at: string;
};
