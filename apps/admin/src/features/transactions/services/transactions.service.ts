import type { PaginatedResponse } from "@/types/api.type";
import { TRANSACTIONS } from "../data/transactions.data";
import type { StatusCounts, Transaction, TransactionListParams } from "../types/transaction.type";

const DEFAULT_PER_PAGE = 10;
/** Deliberate mock placeholder matching the reference footer
 * ("1-10 of 9999999 transactions") — not a real dataset count. */
const MOCK_TOTAL_PLACEHOLDER = 9999999;

function matchesFilters(row: Transaction, params: TransactionListParams): boolean {
  if (params.search) {
    const needle = params.search.toLowerCase();
    const haystack = `${row.invoice_no} ${row.customer.name}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (params.userId && String(row.customer.user_id) !== params.userId) return false;
  if (params.productId && row.product.id !== params.productId) return false;
  if (params.invoiceStatus && row.invoice_status !== params.invoiceStatus) return false;
  if (params.paymentStatus && row.payment_status !== params.paymentStatus) return false;
  if (params.paymentMethod && row.payment_method !== params.paymentMethod) return false;
  if (params.startDate && row.created_at < params.startDate) return false;
  if (params.endDate && row.created_at > params.endDate) return false;
  return true;
}

// Mock-backed for now (backend not built yet). Swap each method body to a
// real `api.get/post(...)` call once the backend ships — hooks/UI stay
// unchanged. See system_architecture.md §6.
export const transactionsService = {
  list: async (params: TransactionListParams): Promise<PaginatedResponse<Transaction>> => {
    const page = params.page ?? 1;
    const perPage = params.per_page ?? DEFAULT_PER_PAGE;
    const filtered = TRANSACTIONS.filter((row) => matchesFilters(row, params));

    const start = (page - 1) * perPage;
    const pageRows = filtered.slice(start, start + perPage);
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));

    return {
      data: pageRows,
      links: {
        first: "/transactions?page=1",
        last: `/transactions?page=${lastPage}`,
        prev: page > 1 ? `/transactions?page=${page - 1}` : null,
        next: page < lastPage ? `/transactions?page=${page + 1}` : null,
      },
      meta: {
        current_page: page,
        from: pageRows.length ? start + 1 : null,
        last_page: lastPage,
        path: "/transactions",
        per_page: perPage,
        to: pageRows.length ? start + pageRows.length : null,
        total: MOCK_TOTAL_PLACEHOLDER,
      },
    };
  },

  getById: async (id: string): Promise<Transaction> => {
    const found = TRANSACTIONS.find((row) => row.id === id);
    if (!found) throw new Error(`No transaction found for id: ${id}`);
    return found;
  },

  getStatusCounts: async (): Promise<StatusCounts> => ({
    pending: 12,
    partial_refund: 32,
    partial_success: 8,
  }),

  edit: async (id: string, formData: FormData): Promise<Transaction> => {
    const found = TRANSACTIONS.find((row) => row.id === id);
    if (!found) throw new Error(`No transaction found for id: ${id}`);

    const paymentStatus = formData.get("paymentStatus");
    const invoiceStatus = formData.get("invoiceStatus");
    const serialNumber = formData.get("serialNumber");

    return {
      ...found,
      payment_status: (paymentStatus as Transaction["payment_status"] | null) ?? found.payment_status,
      invoice_status: (invoiceStatus as Transaction["invoice_status"] | null) ?? found.invoice_status,
      serial_number: (serialNumber as string | null) ?? found.serial_number,
      updated_at: new Date().toISOString(),
    };
  },

  refund: async (id: string, reason: string): Promise<void> => {
    if (!TRANSACTIONS.some((row) => row.id === id)) throw new Error(`No transaction found for id: ${id}`);
    if (!reason.trim()) throw new Error("A refund reason is required");
  },

  resendCallback: async (id: string): Promise<void> => {
    if (!TRANSACTIONS.some((row) => row.id === id)) throw new Error(`No transaction found for id: ${id}`);
  },

  retryInvoice: async (id: string): Promise<void> => {
    if (!TRANSACTIONS.some((row) => row.id === id)) throw new Error(`No transaction found for id: ${id}`);
  },

  remove: async (id: string): Promise<void> => {
    if (!TRANSACTIONS.some((row) => row.id === id)) throw new Error(`No transaction found for id: ${id}`);
  },
};
