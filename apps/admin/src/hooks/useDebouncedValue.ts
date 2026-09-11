import { useEffect, useState } from "react";

/**
 * The value, held back until it stops changing.
 *
 * For filter inputs that drive a query. Typing "1500000" into a price field is
 * seven keystrokes and, without this, seven requests — six of them for ranges
 * the admin never meant (a ceiling of "1" matches nothing, so the table blinks
 * empty on the way to the number they wanted).
 *
 * Deliberately not applied to selects: a dropdown choice is deliberate and one
 * event, so delaying it only makes the page feel slow.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
