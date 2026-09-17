import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  priceListSearchSchema,
  type PriceListSearchValues,
} from "@/features/price-list/schemas/priceList.schema";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { storefrontService } from "@/services/storefront.service";
import type { PriceListItem, SortOption } from "@/features/price-list/types/priceList.type";

const PER_PAGE = 10;
const SEARCH_DEBOUNCE_MS = 350;

/**
 * The public price list.
 *
 * Filtering, sorting and pagination all run server-side — the catalog is
 * unbounded, so slicing a client-side array would silently only ever search
 * whatever happened to be loaded. The hook's return shape is unchanged, so the
 * table, toolbar and pagination components did not have to be touched.
 */
export function usePriceList() {
  const form = useForm<PriceListSearchValues>({
    resolver: zodResolver(priceListSearchSchema),
    defaultValues: { query: "" },
  });

  // useWatch is memoization-safe (React Compiler compatible) unlike form.watch()
  const queryValue = useWatch({ control: form.control, name: "query" }) ?? "";
  const debouncedQuery = useDebouncedValue(queryValue.trim(), SEARCH_DEBOUNCE_MS);

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["price-list", debouncedQuery, activeGameId, sortOption, currentPage],
    queryFn: async () => {
      const response = await storefrontService.priceList({
        search: debouncedQuery || undefined,
        // A slug, not an id: the selector and the checkout route both address
        // games that way, and the API resolves all three forms.
        game: activeGameId ?? undefined,
        sort: sortOption,
        per_page: PER_PAGE,
        page: currentPage,
      });
      return response.data;
    },
    // Keeps the previous page on screen while the next one loads, so paging
    // doesn't blank the table.
    placeholderData: keepPreviousData,
  });

  const pagedRows = useMemo<PriceListItem[]>(
    () =>
      (data?.data ?? []).map((row) => ({
        id: row.id,
        serviceName: row.service_name,
        gameId: row.game_slug ?? String(row.game_id),
        gameName: row.game_name ?? "",
        gameLogo: row.game_logo_url ?? "",
        gameRegion: row.game_region ?? "",
        normalPrice: row.normal_price,
        tiers: (row.tiers ?? []).map((tier) => ({
          planId: tier.membership_plan_id,
          planCode: tier.plan_code,
          planName: tier.plan_name,
          isDefault: tier.is_default,
          isHidden: tier.is_hidden,
          price: tier.price,
        })),
        status: row.status,
        stockLeft: row.stock_left ?? null,
        isSoldOut: Boolean(row.is_sold_out),
      })),
    [data],
  );

  // Reset to page 1 whenever filters change
  const handleSetActiveGameId = (id: string | null) => {
    setActiveGameId(id);
    setCurrentPage(1);
  };

  const handleSetSortOption = (opt: SortOption) => {
    setSortOption(opt);
    setCurrentPage(1);
  };

  const handleSetQuery = () => {
    setCurrentPage(1);
  };

  return {
    form,
    pagedRows,
    totalResults: data?.meta.total ?? 0,
    activeGameId,
    setActiveGameId: handleSetActiveGameId,
    sortOption,
    setSortOption: handleSetSortOption,
    currentPage: data?.meta.current_page ?? currentPage,
    setCurrentPage,
    totalPages: Math.max(1, data?.meta.last_page ?? 1),
    /** Called when the search field value changes, to reset pagination */
    onQueryChange: handleSetQuery,
  };
}
