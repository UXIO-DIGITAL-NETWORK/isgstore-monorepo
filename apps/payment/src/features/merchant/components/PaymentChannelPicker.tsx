import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Check } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { resolvePaymentLogo } from "@/constants/paymentLogos";
import { cn } from "@/lib/utils";
import type { ServicePaymentChannel } from "@/types/service.type";
import { formatCurrency } from "@/utils/currency";

const TYPE_LABELS: Record<string, string> = {
  qris: "QRIS",
  virtual_account: "Virtual Account",
  ewallet: "E-Wallet",
};

interface PaymentChannelPickerProps {
  channels: ServicePaymentChannel[];
  selectedId: number | null;
  onSelect: (channel: ServicePaymentChannel) => void;
  isLoading?: boolean;
  /**
   * A failed request and an empty schedule used to render the same sentence —
   * "no payment methods" — so a 503 from the licence gate read as a fact about
   * the account and sent everyone looking in the wrong place.
   */
  isError?: boolean;
}

/**
 * The methods a client may settle a bill with, as brand tiles.
 *
 * A logo does in 28px what a name needed a line for, so twelve methods fit in a
 * column that used to hold three — which is what makes the whole list readable
 * beside the bills rather than below them. The artwork is bundled and resolved
 * by `channel_code`, the same set the storefront shows, so an unrecognised
 * channel still renders a tile instead of a broken image.
 *
 * The fee stays per method: it is the one thing that differs between two
 * otherwise identical-looking options.
 */
export function PaymentChannelPicker({
  channels,
  selectedId,
  onSelect,
  isLoading,
  isError = false,
}: PaymentChannelPickerProps) {
  const { t } = useTranslation("merchant");

  if (isLoading) {
    return <Text variant="small">{t("paymentPicker.loading")}</Text>;
  }

  if (isError) {
    return (
      <Text
        variant="small"
        className="text-destructive"
      >
        {t("paymentPicker.error")}
      </Text>
    );
  }

  if (channels.length === 0) {
    return (
      <Text
        variant="small"
        className="text-destructive"
      >
        {t("paymentPicker.none")}
      </Text>
    );
  }

  const groups = channels.reduce<Record<string, ServicePaymentChannel[]>>((acc, channel) => {
    (acc[channel.payment_type] ??= []).push(channel);
    return acc;
  }, {});

  return (
    <Box className="@container flex flex-col gap-4">
      {Object.entries(groups).map(([type, items]) => (
        <Box
          key={type}
          className="flex flex-col gap-1.5"
        >
          <Text
            as="span"
            variant="small"
            className="text-muted-foreground"
          >
            {TYPE_LABELS[type] ?? type}
          </Text>
          <Box className="flex flex-col gap-1.5">
            {items.map((channel) => {
              const selected = selectedId === channel.id;

              return (
                <Box
                  as="button"
                  type="button"
                  key={channel.id}
                  onClick={() => onSelect(channel)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                    selected ? "border-foreground bg-accent" : "border-border hover:bg-accent/50",
                  )}
                >
                  <img
                    src={resolvePaymentLogo(channel.channel_code)}
                    alt=""
                    className="size-7 shrink-0 object-contain"
                  />
                  <Box className="flex min-w-0 flex-1 flex-col">
                    <Text
                      as="span"
                      className="truncate text-sm font-medium"
                    >
                      {channel.name}
                    </Text>
                    <Text
                      as="span"
                      variant="small"
                      className="tabular-nums text-muted-foreground"
                    >
                      {feeLabel(channel, t)}
                    </Text>
                  </Box>
                  {/* Colour is not the only signal for the chosen method. */}
                  {selected && <Check className="size-4 shrink-0" />}
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** What this method adds to the bill, in the terms the client will be charged. */
function feeLabel(channel: ServicePaymentChannel, t: TFunction<"merchant">): string {
  const parts: string[] = [];

  if (channel.fee_flat > 0) parts.push(formatCurrency(channel.fee_flat, { fractionDigits: 0 }));
  if (channel.fee_percent > 0) parts.push(`${channel.fee_percent}%`);

  return parts.length === 0 ? t("paymentPicker.noAdminFee") : `+ ${parts.join(" + ")}`;
}
