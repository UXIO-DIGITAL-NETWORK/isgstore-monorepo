import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";

/** A refund this account claimed. Narrower than the admin shape by design. */
export interface MemberRefundModel {
  refund_number: string;
  invoice_number: string | null;
  product: string | null;
  amount: number;
  status: "WAITING_ACCOUNT" | "WAITING_DETAILS" | "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  claimed_at: string | null;
  /** What we promised: 2x24 working hours from the claim. */
  verify_due_at: string | null;
  refunded_at: string | null;
  reject_reason: string | null;
  created_at: string | null;
}

export const memberRefundService = {
  /**
   * Refunds claimed by this account.
   *
   * This list exists because claiming a refund never rewrites the order's
   * owner — the failed order stays a guest order, so it will not appear in
   * "Riwayat Transaksi". Without this page the customer's only trace would be
   * balance appearing out of nowhere days later.
   */
  list: async (): Promise<ApiResponse<{ data: MemberRefundModel[] }>> =>
    await api.get(`${API_VERSION}/me/refunds`),
};
