import { api } from "@/config/axios";
import { API_VERSION } from "@/config/env";
import type { ApiResponse } from "@/types/api.type";
import type {
  ClaimAccountResult,
  PayoutBank,
  PayoutDetailsPayload,
  RefundClaimModel,
  RegisterAndClaimPayload,
} from "../types/refund.type";

const BASE = `${API_VERSION}/refund-claims`;

export const refundService = {
  /**
   * "I lost the email." The response is identical whether or not anything
   * matched — the link is re-sent to the contact already on the order rather
   * than handed back here, so this endpoint cannot be used to discover which
   * email owns an invoice.
   */
  resendClaimLink: async (invoiceNumber: string, contact: string): Promise<ApiResponse<null>> =>
    await api.post(`${BASE}/resend`, { invoice_number: invoiceNumber, contact }),

  claim: async (token: string): Promise<ApiResponse<RefundClaimModel>> => await api.get(`${BASE}/${token}`),

  submitPayoutDetails: async (
    token: string,
    payload: PayoutDetailsPayload,
  ): Promise<ApiResponse<RefundClaimModel>> => await api.post(`${BASE}/${token}/payout-details`, payload),

  payoutBanks: async (): Promise<ApiResponse<PayoutBank[]>> => await api.get(`${API_VERSION}/payout-banks`),

  /**
   * Create an account and claim the refund with it, in one request.
   *
   * Returns a token pair as well as the refund: the customer is signed in on
   * the spot, which is what lets them follow the refund from their account
   * instead of hanging on to the emailed link.
   */
  registerAndClaim: async (
    token: string,
    payload: RegisterAndClaimPayload,
  ): Promise<ApiResponse<ClaimAccountResult>> => await api.post(`${BASE}/${token}/register`, payload),

  /** Claim with the account already signed in. Requires a Bearer token. */
  attachAccount: async (token: string): Promise<ApiResponse<RefundClaimModel>> =>
    await api.post(`${BASE}/${token}/attach`),
};
