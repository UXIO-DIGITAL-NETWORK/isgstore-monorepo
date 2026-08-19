import { useMemo, useRef, useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { BANK_OPTIONS } from "../constants/bankCodes";

type Props = {
  id?: string;
  value?: string;
  onChange: (code: string) => void;
  invalid?: boolean;
  placeholder?: string;
};

/**
 * Searchable bank / e-wallet picker. Type to filter the ~180-entry catalogue by
 * name or code; selecting sets the `bank_code`. Inline list (no portal) so it
 * stays simple to test and behaves predictably inside the form grid.
 */
export function BankCombobox({ id, value, onChange, invalid, placeholder = "Cari bank atau e-wallet…" }: Props) {
  const selected = BANK_OPTIONS.find((o) => o.code === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? BANK_OPTIONS.filter((o) => o.label.toLowerCase().includes(q)) : BANK_OPTIONS;
    return list.slice(0, 50);
  }, [query]);

  // When open, the field shows what the user is typing; when closed, the picked label.
  const inputValue = open ? query : (selected?.label ?? "");

  return (
    <Box className="relative">
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        autoComplete="off"
        value={inputValue}
        placeholder={placeholder}
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
          {filtered.length === 0 ? (
            <Text className="px-2 py-2 text-sm text-muted-foreground">Bank tidak ditemukan</Text>
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
