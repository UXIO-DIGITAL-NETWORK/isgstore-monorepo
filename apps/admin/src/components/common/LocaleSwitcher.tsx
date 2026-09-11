import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALES, type Locale } from "@/config/i18n";
import { useLocale } from "@/hooks/useLocale";
import { Text } from "./Text";

/**
 * Picking the panel's language.
 *
 * It sits in the navbar slot the product requirements already reserved for a
 * "language/utility action" (§78) — the slot was built as a lightning icon with
 * no handler at all, so this fills it with its intended purpose rather than
 * adding a control.
 *
 * The flag is the affordance, as on the storefront; the current code is spelled
 * out beside it because a flag alone is a poor label for a language, and
 * because two flags at icon size are hard to tell apart.
 */
export function LocaleSwitcher() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  const active = LOCALES.find((option) => option.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("language.label")}
          className="size-9 rounded-md text-muted-foreground"
        >
          <Text
            as="span"
            aria-hidden="true"
            className="text-base leading-none"
          >
            {active.flag}
          </Text>
          <Text
            as="span"
            className="sr-only"
          >
            {t("language.label")}
          </Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={locale}
          onValueChange={(value) => setLocale(value as Locale)}
        >
          {LOCALES.map((option) => (
            <DropdownMenuRadioItem
              key={option.code}
              value={option.code}
            >
              <Text
                as="span"
                aria-hidden="true"
                className="mr-2"
              >
                {option.flag}
              </Text>
              {t(option.labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
