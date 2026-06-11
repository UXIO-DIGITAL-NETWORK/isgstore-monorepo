import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Opens a modal once after `delayMs` milliseconds from mount.
 * Once dismissed, it will not reopen within the same page lifecycle.
 */
export function useDelayedModal(delayMs = 15000) {
  const [isOpen, setIsOpen] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => {
      if (!dismissedRef.current) {
        setIsOpen(true);
      }
    }, delayMs);

    return () => clearTimeout(id);
  }, [delayMs]);

  const close = useCallback(() => {
    dismissedRef.current = true;
    setIsOpen(false);
  }, []);

  return { isOpen, close };
}
