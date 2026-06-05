import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { GAMES } from "@/data/games.data";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Game } from "@/types/game.type";

const SEARCH_DEBOUNCE_MS = 300;

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

  const results = useMemo<Game[]>(() => {
    if (!isSearching) return [];
    const needle = debouncedQuery.trim().toLowerCase();
    return GAMES.filter((g) =>
      `${g.title} ${g.region}`.toLowerCase().includes(needle)
    );
  }, [debouncedQuery, isSearching]);

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
  };
}
