import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  priceListSearchSchema,
  type PriceListSearchValues,
} from "@/features/price-list/schemas/priceList.schema";
import { mockPriceList } from "@/features/price-list/data/mockPriceList";
import type { PriceListItem, SortOption } from "@/features/price-list/types/priceList.type";

const PER_PAGE = 10;

export function usePriceList() {
  const form = useForm<PriceListSearchValues>({
    resolver: zodResolver(priceListSearchSchema),
    defaultValues: { query: "" },
  });

  // useWatch is memoization-safe (React Compiler compatible) unlike form.watch()
  const queryValue = useWatch({ control: form.control, name: "query" }) ?? "";

  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [currentPage, setCurrentPage] = useState(1);

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

  // 1. Filter by game category
  const byGame = useMemo((): PriceListItem[] => {
    if (!activeGameId) return mockPriceList;
    return mockPriceList.filter((item) => item.gameId === activeGameId);
  }, [activeGameId]);

  // 2. Filter by search query (matches service name)
  const bySearch = useMemo((): PriceListItem[] => {
    const q = queryValue.trim().toLowerCase();
    if (!q) return byGame;
    return byGame.filter((item) =>
      item.serviceName.toLowerCase().includes(q) ||
      item.gameName.toLowerCase().includes(q),
    );
  }, [byGame, queryValue]);

  // 3. Sort
  const sorted = useMemo((): PriceListItem[] => {
    const arr = [...bySearch];
    switch (sortOption) {
      case "name-asc":
        return arr.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
      case "price-asc":
        return arr.sort((a, b) => a.normalPrice - b.normalPrice);
      case "price-desc":
        return arr.sort((a, b) => b.normalPrice - a.normalPrice);
      default:
        return arr.sort((a, b) => a.id - b.id);
    }
  }, [bySearch, sortOption]);

  // 4. Pagination
  const totalResults = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedRows = useMemo((): PriceListItem[] => {
    const start = (safeCurrentPage - 1) * PER_PAGE;
    return sorted.slice(start, start + PER_PAGE);
  }, [sorted, safeCurrentPage]);

  return {
    form,
    pagedRows,
    totalResults,
    activeGameId,
    setActiveGameId: handleSetActiveGameId,
    sortOption,
    setSortOption: handleSetSortOption,
    currentPage: safeCurrentPage,
    setCurrentPage,
    totalPages,
    /** Called when the search field value changes, to reset pagination */
    onQueryChange: handleSetQuery,
  };
}
