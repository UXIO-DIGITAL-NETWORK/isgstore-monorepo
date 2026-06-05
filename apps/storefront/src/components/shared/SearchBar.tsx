import React from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Heading } from "@/components/common/Heading";
import { cn } from "@/lib/utils";
import { useGameSearch } from "@/hooks/useGameSearch";
import { POPULAR_SEARCH_GAMES } from "@/data/games.data";
import { SearchPopularCard } from "@/components/shared/search/SearchPopularCard";
import { SearchResultRow } from "@/components/shared/search/SearchResultRow";

type Props = {
  /** Allows the Navbar to control sizing/visibility per breakpoint. */
  className?: string;
};

/**
 * Interactive game search bar.
 *
 * - Focused & empty → "Pencarian Populer" row of portrait cards.
 * - While typing → live-filtered result rows with violet hover highlight.
 * - Click-outside or Escape → closes.
 */
export function SearchBar({ className }: Props): React.JSX.Element {
  const { t } = useTranslation("common");
  const {
    open,
    query,
    isSearching,
    results,
    containerRef,
    inputRef,
    openDropdown,
    setQuery,
    close,
  } = useGameSearch();

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
            ? "bg-white/8 border-[#C084FC]/60"
            : "border-white/8 focus:bg-white/8 focus:border-white/20"
        )}
      />
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 w-4.5 h-4.5 pointer-events-none" />

      {/* ── Dropdown panel ── */}
      {open && (
        <Box className="absolute left-0 right-0 top-full mt-2 z-[60] bg-[#18182A] border border-white/10 rounded-2xl shadow-glow-violet overflow-hidden">
          {!isSearching ? (
            /* ── Popular games row (mockup #1) ── */
            <Box className="p-4">
              <Heading
                as="h3"
                level={6}
                className="font-outfit font-semibold text-[14px] text-white mb-4 leading-none"
              >
                {t("search.popular")}
              </Heading>
              <Box className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {POPULAR_SEARCH_GAMES.map((game) => (
                  <SearchPopularCard key={game.id} game={game} onClose={close} />
                ))}
              </Box>
            </Box>
          ) : results.length > 0 ? (
            /* ── Filtered results list (mockup #2) ── */
            <Box className="max-h-[360px] overflow-y-auto py-2">
              {results.map((game) => (
                <SearchResultRow key={game.id} game={game} onClose={close} />
              ))}
            </Box>
          ) : (
            /* ── Empty state ── */
            <Box className="px-5 py-6 flex items-center justify-center">
              <Text
                as="p"
                className="font-inter text-sm text-white/40"
              >
                {t("search.noResults")}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
