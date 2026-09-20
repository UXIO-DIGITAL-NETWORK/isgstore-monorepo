import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
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
 * The methods a client may settle a bill with, grouped by kind.
 *
 * The fee is shown per method rather than only in the total, because it is the
 * one thing that differs between two otherwise identical-looking options.
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
          className="flex flex-col gap-2"
        >
          <Text
            as="span"
            variant="small"
            className="text-muted-foreground"
          >
            {TYPE_LABELS[type] ?? type}
          </Text>
          <Box className="grid grid-cols-1 gap-2 @sm:grid-cols-2">
            {items.map((channel) => (
              <Box
                as="button"
                type="button"
                key={channel.id}
                onClick={() => onSelect(channel)}
                aria-pressed={selectedId === channel.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  selectedId === channel.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:bg-accent/50",
                )}
              >
                <Text
                  as="span"
                  className="font-medium"
                >
                  {channel.name}
                </Text>
                <Text
                  as="span"
                  variant="small"
                  className="text-muted-foreground tabular-nums"
                >
                  {feeLabel(channel, t)}
                </Text>
              </Box>
            ))}
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
