import { Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Theme } from "@/providers/theme-provider";
import { Text } from "./Text";

const OPTIONS: { value: Theme; labelKey: string; icon: typeof Sun }[] = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Monitor },
];

/**
 * Picking a theme — three choices, not a switch.
 *
 * It used to be a binary `light ⇄ dark` flip over three possible states, which
 * went wrong in both directions. From the initial `"system"` it computed
 * `light`, so someone on a dark OS pressing the moon got the **light** theme;
 * and once flipped, `"system"` could never be reached again from the UI at all.
 *
 * A radio group also lets the menu say which option is in force, which a single
 * icon cannot: with `system` selected the button shows the resolved sun or moon,
 * identical to having chosen that theme by hand.
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("theme.label")}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <Text
            as="span"
            className="sr-only"
          >
            {t("theme.label")}
          </Text>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {OPTIONS.map(({ value, labelKey, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
            >
              <Icon className="mr-2 size-4" />
              {t(labelKey)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
