import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { searchSchema, type SearchFormValues } from "@/features/track-order/schemas/trackOrder.schema";
import { storefrontService } from "@/services/storefront.service";
import type { TrackOrderRow, TrackOrderStatus } from "@/features/track-order/types/trackOrder.type";
import type { TransactionStatus } from "@/types/models/transaction.model";

/**
 * The API's seven statuses collapsed into the three the table renders.
 * Everything paid-but-not-yet-delivered is one "in process" state as far as
 * the customer is concerned.
 */
const STATUS_MAP: Record<TransactionStatus, TrackOrderStatus> = {
  PENDING: "process",
  PAID: "process",
  PROCESSING: "process",
  COMPLETED: "success",
  FAILED_PROVIDER: "failed",
  EXPIRED: "failed",
  REFUNDED: "failed",
};

/**
 * Order lookup by invoice number or WhatsApp number.
 *
 * Search runs on submit rather than as-you-type: the endpoint takes a phone
 * number and is rate-limited like checkout, so a request per keystroke would
 * both burn that budget and probe the table with partial numbers.
 */
export function useTrackOrderSearch() {
  const [submittedQuery, setSubmittedQuery] = useState("");

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });

  const query = useQuery({
    queryKey: ["track-order", submittedQuery],
    queryFn: async () => {
      const response = await storefrontService.trackOrders(submittedQuery);
      return response.data;
    },
    enabled: submittedQuery.length > 0,
  });
  const { data, isFetching } = query;

  const filteredRows = useMemo<TrackOrderRow[]>(
    () =>
      (data ?? []).map((row) => ({
        invoiceNumber: row.invoice_number,
        createdAt: row.created_at,
        service: row.service ?? "",
        amount: row.amount,
        adminFee: row.admin_fee ?? 0,
        // Never returned by the public endpoint — the phone number is the
        // search input, not an output, and echoing it back would hand it to
        // anyone holding the invoice number.
        whatsapp: "",
        status: STATUS_MAP[row.status],
        gameId: row.game_slug ?? "",
        gameName: row.game_name ?? "",
        gameLogo: row.game_logo_url ?? "",
      })),
    [data],
  );

  const onSubmit = form.handleSubmit((values) => setSubmittedQuery(values.query.trim()));

  return { form, filteredRows, onSubmit, isSearching: isFetching, hasSearched: submittedQuery.length > 0, query };
}
