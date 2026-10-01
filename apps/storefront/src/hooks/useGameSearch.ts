import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGamesQuery } from "@/hooks/useGamesQuery";
import type { Game } from "@/types/game.type";

const SEARCH_DEBOUNCE_MS = 300;
/** The dropdown only has room for a handful of rows. */
const SEARCH_RESULT_LIMIT = 8;

interface UseGameSearchReturn {
  open: boolean;
  query: string;
  isSearching: boolean;
  results: Game[];
  containerRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLInputElement>;
  openDropdown: () => void;
  setQuery: (value: string) => void;
  close: () => void;
  /** The results query, so the dropdown can show loading / error / empty. */
  resultsQuery: ReturnType<typeof useGamesQuery>;
}

/**
 * Manages all state and logic for the Navbar search bar dropdown.
 *
 * - `query` updates instantly (controls the input, no typing lag).
 * - Filtering runs on `debouncedQuery` (300 ms after the user stops typing)
 *   so expensive work is deferred without any perceived input delay.
 * - Attaches click-outside and Escape-key listeners to auto-close the dropdown.
 */
export function useGameSearch(): UseGameSearchReturn {
  const [open, setOpen] = useState(false);
  const [query, setQueryState] = useState("");

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  const containerRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);

  // isSearching / results are driven by the debounced value so the popular
  // panel stays visible while the user is mid-keystroke.
  const isSearching = debouncedQuery.trim().length > 0;

  // Filtering happens server-side: the catalog is not bounded by what fits in
  // the bundle, so a client-side filter would only ever search the first page.
  const resultsQuery = useGamesQuery({
    search: debouncedQuery.trim(),
    perPage: SEARCH_RESULT_LIMIT,
    enabled: isSearching,
  });

  const results = useMemo<Game[]>(
    () => (isSearching ? (resultsQuery.data ?? []) : []),
    [resultsQuery.data, isSearching],
  );

  // Close on click-outside and Escape key
  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const openDropdown = useCallback(() => setOpen(true), []);

  const setQuery = useCallback(
    (value: string) => {
      setQueryState(value);
      if (!open) setOpen(true);
    },
    [open]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQueryState("");
  }, []);

  return {
    open,
    query,
    isSearching,
    results,
    containerRef,
    inputRef,
    openDropdown,
    setQuery,
    close,
    resultsQuery,
  };
}
