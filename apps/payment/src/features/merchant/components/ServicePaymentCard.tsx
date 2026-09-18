import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { CopyButton } from "@/components/common/CopyButton";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ServiceInvoicePayment, ServicePaymentChannel } from "@/types/service.type";
import { formatCurrency } from "@/utils/currency";

import { useQrDataUrl } from "../hooks/useQrDataUrl";
import { adminFeeFor } from "../lib/adminFee";
import { PaymentChannelPicker } from "./PaymentChannelPicker";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface ServicePaymentCardProps {
  payment: ServiceInvoicePayment | null;
  /** The bill, for pricing a fresh attempt after this one lapses. */
  amount: number;
  channels: ServicePaymentChannel[];
  isLoadingChannels?: boolean;
  isReopening?: boolean;
  /**
   * Opens a fresh attempt.
   *
   * Omitted where re-opening from this screen would be wrong — a batch is
   * re-opened from the bills tab, where the client can also change which bills
   * are included, since re-opening it blind here would silently re-bill a set
   * they may have part-paid. When it is omitted the card says where to go
   * instead of rendering a button that does nothing.
   */
  onReopen?: (channel: ServicePaymentChannel) => void;
}

/**
 * How to settle the bill right now.
 *
 * Branches on which keys the gateway actually returned rather than on the
 * channel type — one card therefore covers QRIS, a virtual account and an
 * e-wallet, and a method that answers with something new degrades to showing
 * the reference rather than to a blank panel.
 *
 * Three states, and the middle one exists because the previous two-state
 * version labelled a SETTLED payment "already expired": status decides, not
 * "is it PENDING", so a success never reads as a failure.
 */
export function ServicePaymentCard({
  payment,
  amount,
  channels,
  isLoadingChannels,
  isReopening,
  onReopen,
}: ServicePaymentCardProps) {
  const [channel, setChannel] = useState<ServicePaymentChannel | null>(null);
  const { t } = useTranslation("merchant");
  const instructions = payment?.instructions ?? null;
  const qrDataUrl = useQrDataUrl(instructions?.qr_string);

  if (payment?.status === "PAID") {
    return (
      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex items-center gap-2">
          {/* Icon as well as colour: the state is never carried by hue alone. */}
          <CheckCircle2
            aria-hidden="true"
            className="size-5 shrink-0 text-success"
          />
          <Heading level={3}>{t("payment.received")}</Heading>
        </Box>
        <Text
          variant="small"
          className="text-muted-foreground"
        >
          {t("payment.receivedHint", { amount: money(payment.total) })}
        </Text>
      </Box>
    );
  }

  // Payable only while the gateway's own deadline holds. A page left open past
  // it flips to the re-open state on the next poll.
  const payable = payment?.status === "PENDING" && !payment.is_expired;

  if (!payable) {
    const adminFee = adminFeeFor(channel, amount);

    return (
      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Heading level={3}>{t("payment.title")}</Heading>
        <Text
          variant="small"
          className="text-muted-foreground"
        >
          {payment ? t("payment.lapsed") : t("payment.notOpened")}
        </Text>

        {onReopen ? (
          <>
            <Box className="flex flex-col gap-3">
              <Label>{t("payment.method")}</Label>
              <PaymentChannelPicker
                channels={channels}
                selectedId={channel?.id ?? null}
                onSelect={setChannel}
                isLoading={isLoadingChannels}
              />
            </Box>

            <Box className="flex flex-col gap-2 border-t border-border pt-4">
              <Row
                label={t("payment.adminFee")}
                value={money(adminFee)}
              />
              <Row
                label={t("payment.total")}
                value={money(amount + adminFee)}
              />
            </Box>

            <Button
              disabled={!channel || isReopening}
              onClick={() => channel && onReopen(channel)}
            >
              {isReopening ? t("payment.creating") : t("payment.create")}
            </Button>
          </>
        ) : (
          <Link
            href="/app/payment-admin/services?tab=bills"
            className="w-fit"
          >
            <Button variant="outline">{t("payment.reopenFromBills")}</Button>
          </Link>
        )}
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
      <Box className="flex flex-wrap items-center justify-between gap-2">
        <Heading level={3}>{t("payment.title")}</Heading>
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          {payment.channel}
        </Text>
      </Box>

      {qrDataUrl && (
        <Box className="flex flex-col items-center gap-2">
          <Box
            as="img"
            src={qrDataUrl}
            alt={t("payment.qrAlt")}
            className="h-48 w-48 rounded-xl border border-border bg-white p-2"
          />
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {t("payment.qrHint")}
          </Text>
        </Box>
      )}

      {instructions?.virtual_account && (
        <Row
          label={`${t("payment.vaNumber")}${instructions.bank_code ? ` ${instructions.bank_code}` : ""}`}
          value={instructions.virtual_account}
          copyable
        />
      )}

      {(instructions?.redirect_url || instructions?.deeplink_url) && (
        <Link
          href={(instructions.redirect_url ?? instructions.deeplink_url) as string}
          target="_blank"
          rel="noreferrer"
        >
          <Button className="w-full">{t("payment.continueToApp")}</Button>
        </Link>
      )}

      <Box className="flex flex-col gap-2 border-t border-border pt-4">
        <Row
          label={t("payment.amount")}
          value={money(payment.amount)}
        />
        {payment.admin_fee > 0 && (
          <Row
            label={t("payment.adminFee")}
            value={money(payment.admin_fee)}
          />
        )}
        <Row
          label={t("payment.totalDue")}
          value={money(payment.total)}
          copyable
          copyValue={String(payment.total)}
        />
        {payment.expires_at && (
          <Row
            label={t("payment.payBefore")}
            value={<Countdown until={payment.expires_at} />}
          />
        )}
      </Box>

      <Text
        variant="small"
        className="text-muted-foreground"
      >
        {t("payment.autoRefresh")}
      </Text>
    </Box>
  );
}

function Row({
  label,
  value,
  copyable = false,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyable?: boolean;
  copyValue?: string;
}) {
  return (
    <Box className="flex items-center justify-between gap-4">
      <Text
        as="span"
        variant="small"
        className="text-muted-foreground"
      >
        {label}
      </Text>
      <Box className="flex items-center gap-1">
        <Text
          as="span"
          className="font-medium tabular-nums"
        >
          {value}
        </Text>
        {copyable && (
          <CopyButton
            value={copyValue ?? String(value)}
            label={label}
          />
        )}
      </Box>
    </Box>
  );
}

/**
 * Counts down to the gateway's own deadline.
 *
 * The instant it runs out the card still shows an unusable QR, so the tick also
 * serves to flip this component over to the re-open state on the next poll.
 */
function Countdown({ until }: { until: string }) {
  const { t } = useTranslation("merchant");
  // Held together with the deadline it was measured against, so a new deadline
  // is reflected in the same render it arrives — no reset from inside an
  // effect, which would cost a cascading render every second.
  const [tick, setTick] = useState(() => ({ until, remaining: secondsUntil(until) }));

  useEffect(() => {
    const id = setInterval(() => setTick({ until, remaining: secondsUntil(until) }), 1000);

    return () => clearInterval(id);
  }, [until]);

  const remaining = tick.until === until ? tick.remaining : secondsUntil(until);

  if (remaining <= 0) return <>{t("payment.expired")}</>;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return <>{`${minutes}:${String(seconds).padStart(2, "0")}`}</>;
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}
