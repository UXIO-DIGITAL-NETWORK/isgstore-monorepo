import { useState } from "react";

import { Box } from "@/components/common/Box";
import { FieldLabel } from "@/components/common/FieldLabel";
import { SelectField } from "@/components/common/SelectField";
import { Text } from "@/components/common/Text";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCekUsernameSkuOptions } from "@/hooks/useCekUsernameSkuOptions";
import { useProductOptions } from "@/hooks/useProductOptions";

type Mode = "product" | "digiflazz" | "url";

const MODE_OPTIONS = [
  { value: "product", label: "Pick a product" },
  { value: "digiflazz", label: "Digiflazz cek-username SKU" },
  { value: "url", label: "Custom URL (free API)" },
];

const ENABLE_TOOLTIP =
  "Master switch for the storefront's “Cek Username” button on this game. " +
  "Off means the customer buys without a name check; on means the name is resolved via the provider below. " +
  "Turning it off keeps the provider configuration, so it can be switched back on without re-entry.";

const METHOD_TOOLTIP =
  "How the player's name is resolved when the check is on. " +
  "“Pick a product” uses that product's Digiflazz cek-username SKU (recommended). " +
  "“Digiflazz cek-username SKU” picks a paid Digiflazz inquiry SKU directly. " +
  "“Custom URL” calls a free third-party lookup API instead.";

function detectMode(value: string): Mode {
  if (value.startsWith("digiflazz:")) return "digiflazz";
  if (value.startsWith("http://") || value.startsWith("https://")) return "url";
  return "product";
}

interface NicknameCheckFieldProps {
  /** Master on/off — whether this game requires a username check at all. */
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** The provider string stored in `categories.validasi_nickname` (the "how"). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * The category form's "Cek Username" control. A master Switch decides whether the
 * game needs the check; when on, a provider selector configures how the name is
 * resolved (`product:{id}`, `digiflazz:{sku}`, or a lookup URL — stored verbatim
 * in `categories.validasi_nickname`). Disabling never clears the provider, so a
 * game can be flipped back on without re-picking it.
 */
export function NicknameCheckField({ enabled, onEnabledChange, value, onChange }: NicknameCheckFieldProps) {
  const [mode, setMode] = useState<Mode>(() => detectMode(value));
  const { options, isLoading } = useProductOptions(enabled && mode === "product");
  const { options: skuOptions, isLoading: skusLoading } = useCekUsernameSkuOptions(enabled && mode === "digiflazz");

  const handleModeChange = (next: string) => {
    const nextMode = next as Mode;
    setMode(nextMode);
    // Reset the stored value unless the current one already fits the new mode,
    // so we never leave a product id behind when switching to URL and back.
    if (nextMode === "product" && !value.startsWith("product:")) onChange("");
    else if (nextMode === "digiflazz" && !value.startsWith("digiflazz:")) onChange("");
    else if (nextMode === "url" && detectMode(value) !== "url") onChange("");
  };

  return (
    <Box className="flex flex-col gap-2">
      <Box className="flex items-center justify-between gap-4">
        <FieldLabel
          htmlFor="cek-username-enabled"
          tooltip={ENABLE_TOOLTIP}
        >
          Cek Username
        </FieldLabel>
        <Switch
          id="cek-username-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
      </Box>

      {enabled && (
        <>
          <SelectField
            id="cek-username-mode"
            label="Metode Cek"
            tooltip={METHOD_TOOLTIP}
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

          {mode === "digiflazz" && (
            <SelectField
              id="cek-username-sku"
              label="Digiflazz SKU"
              tooltip="A Digiflazz cek-username / inquiry SKU. The player's in-game name comes back in the transaction “sn”. Pulled live from the Digiflazz price list."
              options={skuOptions}
              value={value.startsWith("digiflazz:") ? value : ""}
              onChange={onChange}
              disabled={skusLoading}
              emptyLabel={skusLoading ? "Loading SKUs..." : "No cek-username SKUs found"}
              placeholder="Select a SKU"
            />
          )}

          {mode === "url" && (
            <Box className="flex flex-col gap-1.5">
              <FieldLabel
                htmlFor="cek-username-url"
                tooltip="A third-party lookup endpoint. Use {user_id}, {server_id} or {customer_no} placeholders, e.g. https://api.example.com/check?id={user_id}."
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

          {!value && (
            <Text
              variant="small"
              className="text-muted-foreground"
            >
              Pilih provider agar pengecekan berjalan.
            </Text>
          )}
        </>
      )}
    </Box>
  );
}
