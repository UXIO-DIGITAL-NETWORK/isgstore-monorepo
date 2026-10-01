import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Box } from "@/components/common/Box";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { QueryState } from "@/components/common/QueryState";
import { Skeleton } from "@/components/common/Skeleton";
import { Heading } from "@/components/common/Heading";
import { cn } from "@/lib/utils";
import { useGameSearch } from "@/hooks/useGameSearch";
import { useGamesQuery } from "@/hooks/useGamesQuery";
import { SearchPopularCard } from "@/components/shared/search/SearchPopularCard";
import { SearchResultRow } from "@/components/shared/search/SearchResultRow";

/** Cards that fit the popular row without wrapping. */
const POPULAR_SUGGESTION_COUNT = 5;
/** Rows shown while the debounced result request is in flight. */
const RESULT_SKELETON_COUNT = 4;

type Props = {
  /** Allows the Navbar to control sizing/visibility per breakpoint. */
  className?: string;
};

/**
 * Interactive game search bar.
 *
 * - Focused & empty → "Pencarian Populer" row of portrait cards.
 * - While typing → live-filtered result rows with gold hover highlight.
 * - Click-outside or Escape → closes.
 *
 * Both panes carry their own loading / error / empty state: a search that
 * silently shows nothing looks like "no results" even when the request failed.
 */
export function SearchBar({ className }: Props): React.JSX.Element {
  const { t } = useTranslation("common");
  const {
    open,
    query,
    isSearching,
    results,
    resultsQuery,
    containerRef,
    inputRef,
    openDropdown,
    setQuery,
    close,
  } = useGameSearch();

  // "Pencarian Populer" — the same best-sellers the homepage rail shows, so an
  // empty search suggests what people actually buy rather than a fixed list.
  const popularQuery = useGamesQuery({ sort: "popular", perPage: POPULAR_SUGGESTION_COUNT });

  return (
    <Box
      ref={containerRef}
      className={cn("relative items-center", className)}
    >
      {/* ── Input row ── */}
      <Box
        as="input"
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t("action.search")}
        onFocus={openDropdown}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        className={cn(
          "w-full h-10 bg-white/5 border rounded-full pl-5 pr-11",
          "text-sm text-white placeholder:text-white/30 font-inter",
          "outline-none transition-all",
          open
            ? "bg-white/8 border-[rgb(208,201,129)]/60"
            : "border-white/8 focus:bg-white/8 focus:border-white/20"
        )}
      />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 w-4.5 h-4.5 pointer-events-none" />

      {/* ── Dropdown panel ── */}
      {open && (
        <Box className="absolute left-0 right-0 top-full mt-2 z-[60] bg-[rgb(26,34,16)] border border-white/10 rounded-2xl shadow-glow-accent overflow-hidden">
          {!isSearching ? (
            /* ── Popular games row ── */
            <Box className="p-4">
              <Heading
                as="h3"
                level={6}
                className="font-outfit font-semibold text-[14px] text-white mb-4 leading-none"
              >
                {t("search.popular")}
              </Heading>
              <QueryState
                query={popularQuery}
                skeleton={
                  <Box className="flex gap-3 pb-1">
                    {Array.from({ length: POPULAR_SUGGESTION_COUNT }).map((_, index) => (
                      <Skeleton key={index} className="h-28 w-24 shrink-0 rounded-xl" />
                    ))}
                  </Box>
                }
                isEmpty={(games) => games.length === 0}
                empty={<EmptyState compact title={t("search.popularEmpty")} />}
                error={<ErrorState variant="inline" onRetry={() => void popularQuery.refetch()} />}
              >
                {(games) => (
                  <Box className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                    {games.map((game) => (
                      <SearchPopularCard key={game.id} game={game} onClose={close} />
                    ))}
                  </Box>
                )}
              </QueryState>
            </Box>
          ) : resultsQuery.isError ? (
            /* ── Search failed ── */
            <Box className="p-4">
              <ErrorState variant="inline" onRetry={() => void resultsQuery.refetch()} />
            </Box>
          ) : resultsQuery.isPending ? (
            /* ── First result set still loading ── */
            <Box className="flex flex-col gap-2 p-4">
              {Array.from({ length: RESULT_SKELETON_COUNT }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </Box>
          ) : results.length > 0 ? (
            /* ── Filtered results list ── */
            <Box className="max-h-[360px] overflow-y-auto py-2">
              {results.map((game) => (
                <SearchResultRow key={game.id} game={game} onClose={close} />
              ))}
            </Box>
          ) : (
            /* ── No matches ── */
            <EmptyState compact title={t("search.noResults")} />
          )}
        </Box>
      )}
    </Box>
  );
}
