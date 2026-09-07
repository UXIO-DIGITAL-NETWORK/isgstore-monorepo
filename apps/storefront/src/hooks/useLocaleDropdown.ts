import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { LOCALES } from "@/constants/locales";
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
 * - Provides a switchLocale handler that navigates to the new locale route
 */
export function useLocaleDropdown(): UseLocaleDropdownReturn {
  const navigate = useNavigate();
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
    navigate({ to: "/$locale", params: { locale: newLocale } });
  };

  return { langOpen, langRef, currentLocale, toggleLangOpen, switchLocale };
}
