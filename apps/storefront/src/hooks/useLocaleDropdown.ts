import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { LOCALES } from "@/constants/locales";
import { swapLocaleInPath } from "@/lib/locale";
import type { LocaleOption } from "@/types/navbar";

interface UseLocaleDropdownReturn {
  langOpen: boolean;
  langRef: React.RefObject<HTMLDivElement>;
  currentLocale: LocaleOption;
  toggleLangOpen: () => void;
  switchLocale: (newLocale: string) => void;
}

/**
 * Manages all state and logic for the Navbar language-switcher dropdown.
 *
 * Responsibilities:
 * - Tracks open/closed state of the language dropdown
 * - Attaches a click-outside listener to auto-close the dropdown
 * - Derives the active LocaleOption from the current route params
 * - Provides a switchLocale handler that re-opens the CURRENT page in the new
 *   locale, query string and hash included
 */
export function useLocaleDropdown(): UseLocaleDropdownReturn {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale = "id" } = useParams({ strict: false }) as { locale?: string };

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (!langOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [langOpen]);

  const currentLocale: LocaleOption =
    LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  const toggleLangOpen = () => setLangOpen((v) => !v);

  const switchLocale = (newLocale: string) => {
    setLangOpen(false);
    // The same page in the other language, not the locale root. Navigating to
    // `/$locale` dropped a buyer on `/en` from the middle of a checkout — see
    // `swapLocaleInPath`.
    navigate({ href: swapLocaleInPath(location.href, newLocale) });
  };

  return { langOpen, langRef, currentLocale, toggleLangOpen, switchLocale };
}
