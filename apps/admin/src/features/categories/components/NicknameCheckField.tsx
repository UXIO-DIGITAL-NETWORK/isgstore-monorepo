import { useState } from "react";

import { Box } from "@/components/common/Box";
import { FieldLabel } from "@/components/common/FieldLabel";
import { SelectField } from "@/components/common/SelectField";
import { Input } from "@/components/ui/input";
import { useProductOptions } from "@/hooks/useProductOptions";

type Mode = "none" | "product" | "url";

const MODE_OPTIONS = [
  { value: "none", label: "None (no check)" },
  { value: "product", label: "Pick a product" },
  { value: "url", label: "Custom URL (free API)" },
];

const TOOLTIP =
  "Turns on the “Cek Username” button on the storefront for this game. " +
  "“Pick a product” resolves the player's name through that product's Digiflazz cek-username SKU (recommended). " +
  "“Custom URL” calls a free third-party lookup API instead. Leave “None” if the game has no username check.";

function detectMode(value: string): Mode {
  if (value.startsWith("product:")) return "product";
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("digiflazz:")) return "url";
  return "none";
}

/**
 * Configures `categories.validasi_nickname` without the admin typing a code.
 * The value is a single string the backend understands: `product:{id}` (the
 * common case, chosen from a dropdown), a lookup URL, or empty for none.
 */
export function NicknameCheckField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [mode, setMode] = useState<Mode>(() => detectMode(value));
  const { options, isLoading } = useProductOptions(mode === "product");

  const handleModeChange = (next: string) => {
    const nextMode = next as Mode;
    setMode(nextMode);
    // Reset the stored value unless the current one already fits the new mode,
    // so we never leave a product id behind when switching to URL and back.
    if (nextMode === "none") onChange("");
    else if (nextMode === "product" && !value.startsWith("product:")) onChange("");
    else if (nextMode === "url" && detectMode(value) !== "url") onChange("");
  };

  return (
    <Box className="flex flex-col gap-2">
      <SelectField
        id="cek-username-mode"
        label="Cek Username"
        tooltip={TOOLTIP}
        options={MODE_OPTIONS}
        value={mode}
        onChange={handleModeChange}
      />

      {mode === "product" && (
        <SelectField
          id="cek-username-product"
          label="Cek Username Product"
          tooltip="The product whose Digiflazz cek-username SKU returns the player's in-game name. Usually a “… Cek Username” product."
          options={options}
          value={value.startsWith("product:") ? value : ""}
          onChange={onChange}
          disabled={isLoading}
          emptyLabel={isLoading ? "Loading products..." : "No products available"}
          placeholder="Select a product"
        />
      )}

      {mode === "url" && (
        <Box className="flex flex-col gap-1.5">
          <FieldLabel
            htmlFor="cek-username-url"
            tooltip="A third-party lookup endpoint. Use {user_id}, {server_id} or {customer_no} placeholders, e.g. https://api.example.com/check?id={user_id}. A legacy digiflazz:sku value can also be entered here."
          >
            Lookup URL
          </FieldLabel>
          <Input
            id="cek-username-url"
            className="rounded-xl"
            placeholder="https://api.example.com/check?id={user_id}"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </Box>
      )}
    </Box>
  );
}
