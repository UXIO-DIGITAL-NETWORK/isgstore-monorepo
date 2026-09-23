import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ServicePaymentChannel } from "@/types/service.type";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";

import { PaymentChannelPicker } from "../components/PaymentChannelPicker";
import { adminFeeFor } from "../lib/adminFee";
import { useMerchantServiceDetail, useServicePaymentChannels, useSubscribeService } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface MerchantServiceCheckoutPageProps {
  serviceId: number;
}

/**
 * What the client is about to buy, before they are committed to it: price,
 * period length, how they will pay, and the exact window the payment will open.
 *
 * The window comes from the server, which applies the same renewal-stacking
 * rule the activation does — deriving it here would eventually disagree with
 * what the client actually gets. The admin fee is mirrored locally so the total
 * updates as methods are compared, but the server recomputes it on submit and
 * its figure is the one charged.
 */
export default function MerchantServiceCheckoutPage({ serviceId }: MerchantServiceCheckoutPageProps) {
  const { t } = useTranslation("merchant");
  const [notes, setNotes] = useState("");
  const [channel, setChannel] = useState<ServicePaymentChannel | null>(null);
  const navigate = useNavigate();
  const { data: service, isLoading, isError } = useMerchantServiceDetail(serviceId);
  const { data: channels, isLoading: loadingChannels, isError: channelsError } = useServicePaymentChannels();
  const { mutate: subscribe, isPending } = useSubscribeService();

  if (isLoading) {
    return <Text variant="small">{t("checkout.loading")}</Text>;
  }

  if (isError || !service) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>{t("checkout.notFound")}</Heading>
        <Text variant="small">{t("checkout.notFoundDescription")}</Text>
        <Link
          href="/app/payment-admin/services"
          className="underline"
        >
          {t("checkout.backToCatalog")}
        </Link>
      </Box>
    );
  }

  const adminFee = adminFeeFor(channel, service.selling_price);
  const total = service.selling_price + adminFee;

  const pay = () => {
    if (!channel) return;

    subscribe(
      { service_id: service.id, payment_channel_id: channel.id, notes: notes.trim() || undefined },
      {
        onSuccess: (invoice) =>
          navigate({
            to: "/app/payment-admin/service-invoices/$invoiceId",
            params: { invoiceId: String(invoice.id) },
          }),
      },
    );
  };

  return (
    <Box className="flex max-w-2xl flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-admin/services"
          className="text-sm text-muted-foreground underline"
        >
          {t("checkout.backToCatalog")}
        </Link>
        <Heading level={1}>{t("checkout.title")}</Heading>
      </Box>

      <Box className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
        <Box className="flex items-start justify-between gap-2">
          <Heading level={2}>{service.name}</Heading>
          <Badge variant="secondary">{service.category_label}</Badge>
        </Box>

        {service.description && <Text variant="small">{service.description}</Text>}

        {service.features.length > 0 && (
          <Box
            as="ul"
            className="flex flex-col gap-1"
          >
            {service.features.map((feature) => (
              <Box
                as="li"
                key={feature}
              >
                <Text
                  as="span"
                  variant="small"
                  className="text-muted-foreground"
                >
                  • {feature}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        <Box className="flex flex-col gap-2 border-t border-border pt-4">
          <Row
            label={t("checkout.price")}
            value={money(service.selling_price)}
          />
          <Row
            label={t("checkout.duration")}
            value={t("checkout.durationValue", { count: service.duration_days })}
          />
          <Row
            label={t("checkout.period")}
            value={`${formatDate(service.projected_starts_at)} – ${formatDate(service.projected_ends_at)}`}
          />
        </Box>

        {service.current_period_ends_at && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {t("checkout.carryOver", { date: formatDate(service.current_period_ends_at) })}
          </Text>
        )}

        {service.has_open_invoice ? (
          // Not an error, a state: this service cannot be bought twice while a
          // bill for it is still open. So the panel says what is blocking and
          // where to resolve it, and the form that could not submit anywhere
          // (method picker, notes, pay button) is not rendered at all.
          <Alert role="status">
            <AlertTitle>{t("checkout.openInvoice")}</AlertTitle>
            <AlertDescription>
              <Box className="flex flex-col items-start gap-3">
                <Text
                  as="span"
                  variant="small"
                >
                  {t("checkout.openInvoiceHint")}
                </Text>
                <Link href={`/app/payment-admin/service-invoices/${service.open_invoice_id}`}>
                  <Button variant="secondary">{t("checkout.viewInvoice")}</Button>
                </Link>
              </Box>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Box className="flex flex-col gap-3 border-t border-border pt-4">
              <Label>{t("checkout.method")}</Label>
              <PaymentChannelPicker
                channels={channels ?? []}
                selectedId={channel?.id ?? null}
                onSelect={setChannel}
                isLoading={loadingChannels}
                isError={channelsError}
              />
              <Box className="flex flex-col gap-2 border-t border-border pt-4">
                <Row
                  label={t("checkout.adminFee")}
                  value={money(adminFee)}
                />
                <Row
                  label={t("checkout.total")}
                  value={money(total)}
                />
              </Box>
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="checkout-notes">{t("checkout.notes")}</Label>
              <Textarea
                id="checkout-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t("checkout.notesPlaceholder")}
              />
            </Box>

            <Button
              className="w-full"
              disabled={isPending || !channel}
              onClick={pay}
            >
              {isPending ? t("checkout.paying") : t("checkout.pay")}
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-baseline justify-between gap-4">
      <Text
        as="span"
        variant="small"
        className="text-muted-foreground"
      >
        {label}
      </Text>
      <Text
        as="span"
        className="font-medium tabular-nums"
      >
        {value}
      </Text>
    </Box>
  );
}
