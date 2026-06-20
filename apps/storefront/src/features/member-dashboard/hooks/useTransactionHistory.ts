import { MOCK_TRANSACTION_HISTORY } from "@/features/member-dashboard/data/transaction-history.mock";
import type { TransactionHistoryRow } from "@/features/member-dashboard/types/dashboard.type";

export function useTransactionHistory(): TransactionHistoryRow[] {
  // Returns mock data synchronously — replace with a TanStack Query hook when the API is ready.
  return MOCK_TRANSACTION_HISTORY;
}
