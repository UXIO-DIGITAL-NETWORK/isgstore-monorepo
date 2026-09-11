import { useTranslation } from "react-i18next";
import { useMemo, useRef, useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { bankLabel, usePayoutBanks } from "@/hooks/usePayoutBanks";

type Props = {
  id?: string;
  value?: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  placeholder?: string;
};

/**
 * Searchable bank / e-wallet picker. Type to filter the ~170-entry catalogue by
 * name or code; selecting sets the `bank_code`. Inline list (no portal) so it
 * stays simple to test and behaves predictably inside the form grid.
 *
 * The catalogue comes from the API (`usePayoutBanks`), so what this offers is
 * exactly what the API will accept. The query is cached for the session, so the
 * two withdrawal forms mounting this share one request.
 */
export function BankCombobox({ id, value, onChange, invalid, placeholder }: Props) {
  const { t } = useTranslation("common");
  const searchPlaceholder = placeholder ?? t("bankPicker.placeholder");
  const { data: banks = [] } = usePayoutBanks();
  const options = useMemo(() => banks.map((bank) => ({ code: bank.code, label: bankLabel(bank) })), [banks]);

  const selected = options.find((o) => o.code === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    return list.slice(0, 50);
  }, [options, query]);

  // When open, the field shows what the user is typing; when closed, the picked
  // label — falling back to the bare code so a value set before the catalogue
  // loads still reads as a choice rather than an empty field.
  const inputValue = open ? query : (selected?.label ?? value ?? "");

  return (
    <Box className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
        value={inputValue}
        placeholder={searchPlaceholder}
        aria-invalid={invalid ? true : undefined}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
        }}
        onBlur={() => {
          // Delay so a click on an option registers before the list closes.
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
      />
      {open && (
        <Box className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {options.length === 0 ? (
            // No catalogue yet — say it is on the way rather than claim the
            // bank does not exist, which is what an empty filter result means.
            <Text className="px-2 py-2 text-sm text-muted-foreground">{t("bankPicker.loading")}</Text>
          ) : filtered.length === 0 ? (
            <Text className="px-2 py-2 text-sm text-muted-foreground">{t("bankPicker.notFound")}</Text>
          ) : (
            filtered.map((o) => (
              <Button
                key={o.code}
                type="button"
                variant="ghost"
                // Prevent the input's blur from closing the list before this fires.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.code);
                  setQuery("");
                  setOpen(false);
                }}
                className={cn(
                  "h-auto w-full justify-start px-2 py-1.5 text-left text-sm font-normal",
                  o.code === value && "bg-accent text-accent-foreground",
                )}
              >
                {o.label}
              </Button>
            ))
          )}
        </Box>
      )}
    </Box>
  );
}
