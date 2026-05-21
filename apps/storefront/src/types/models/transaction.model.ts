export type TransactionStatus = "pending" | "success" | "failed";
export type PaymentMethod = "bank_transfer" | "qris" | "ewallet";

export interface Transaction {
  id: number;
  invoice_number: string;
  user_id: number | null;
  game_id: number;
  product_id: number;
  game_player_id: string;
  whatsapp: string;
  amount: number;
  payment_method: PaymentMethod;
  status: TransactionStatus;
  created_at: string;
  updated_at: string;
}
