import { useEffect, useState } from "react";

/**
 * Debounced mirror of a fast-changing value — used so a keystroke in the search
 * box does not fire a query (and reset pagination) on every character.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
