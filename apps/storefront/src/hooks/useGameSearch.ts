import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { GAMES } from "@/data/games.data";
import type { Game } from "@/types/game.type";

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
 * Responsibilities:
 * - Tracks open/closed state of the search dropdown
 * - Filters the global GAMES list against the current query (title + region)
 * - Attaches click-outside and Escape-key listeners to auto-close the dropdown
 */
export function useGameSearch(): UseGameSearchReturn {
  const [open, setOpen] = useState(false);
  const [query, setQueryState] = useState("");

  const containerRef = useRef<HTMLDivElement>(null!);
  const inputRef = useRef<HTMLInputElement>(null!);

  const isSearching = query.trim().length > 0;

  const results = useMemo<Game[]>(() => {
    if (!isSearching) return [];
    const needle = query.trim().toLowerCase();
    return GAMES.filter((g) =>
      `${g.title} ${g.region}`.toLowerCase().includes(needle)
    );
  }, [query, isSearching]);

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

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
    if (!open) setOpen(true);
  }, [open]);

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
