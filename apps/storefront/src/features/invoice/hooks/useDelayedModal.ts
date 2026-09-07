import { useState, useEffect, useRef, useCallback } from "react";

/** localStorage is unavailable in private mode and throws when the quota is
 *  full. A modal prompt is never worth breaking the page over, so both helpers
 *  degrade to the in-memory behaviour instead of propagating. */
const wasDismissed = (key: string): boolean => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const rememberDismissed = (key: string): void => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    /* ignore — dismissal stays in-memory for this page lifecycle */
  }
};

/**
 * Opens a modal once after `delayMs` milliseconds from mount.
 *
 * Once dismissed it will not reopen within the same page lifecycle. Pass
 * `storageKey` to make that dismissal survive a reload too — without it a
 * refresh re-arms the timer and the customer is asked again, which for someone
 * who already reviewed means a second submit and a "Transaksi ini sudah
 * dinilai." error toast.
 */
export function useDelayedModal(delayMs = 15000, storageKey?: string) {
  const [isOpen, setIsOpen] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (storageKey && wasDismissed(storageKey)) return;

    const id = setTimeout(() => {
      if (!dismissedRef.current) {
        setIsOpen(true);
      }
    }, delayMs);

    return () => clearTimeout(id);
  }, [delayMs, storageKey]);

  const close = useCallback(() => {
    dismissedRef.current = true;
    setIsOpen(false);
    if (storageKey) rememberDismissed(storageKey);
  }, [storageKey]);

  return { isOpen, close };
}
