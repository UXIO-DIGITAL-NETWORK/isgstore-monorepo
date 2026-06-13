import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { searchSchema, type SearchFormValues } from "@/features/track-order/schemas/trackOrder.schema";
import { mockTransactions } from "@/features/track-order/data/mockTransactions";
import type { TrackOrderRow } from "@/features/track-order/types/trackOrder.type";

export function useTrackOrderSearch() {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: "" },
  });

  // useWatch is memoization-safe (React Compiler compatible) unlike form.watch()
  const queryValue = useWatch({ control: form.control, name: "query" }) ?? "";

  const filteredRows = useMemo((): TrackOrderRow[] => {
    const q = queryValue.trim().toLowerCase();
    if (!q) return mockTransactions;
    return mockTransactions.filter(
      (row) =>
        row.invoiceNumber.toLowerCase().includes(q) ||
        row.whatsapp.includes(q),
    );
  }, [queryValue]);

  return { form, filteredRows };
}
