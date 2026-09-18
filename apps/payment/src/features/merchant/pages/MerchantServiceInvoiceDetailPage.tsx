import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { InstallationProgress } from "@/components/common/InstallationProgress";
import { Link } from "@/components/common/Link";
import { SecretValue } from "@/components/common/SecretValue";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { invoiceStatusLabelKey } from "@/lib/invoiceStatus";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { ServiceInstallationDetail } from "@/types/service.type";

import { ServicePaymentCard } from "../components/ServicePaymentCard";
import {
  useMerchantInstallation,
  useMerchantServiceInvoice,
  usePayServiceInvoice,
  useRevealDetail,
  useServicePaymentChannels,
} from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface MerchantServiceInvoiceDetailPageProps {
  invoiceId: number;
}

/**
 * Where a purchase lives after checkout: how to pay it through Monetapay and —
 * once the payment lands — the installation progress and the credentials handed
 * over.
 *
 * The page polls itself while the bill is open, so a client watching it sees
 * the subscription appear without refreshing. Three states end this page, and
 * each one says what it is: still to pay (the card), settled (a confirmation,
 * because a card that merely vanishes reads as a bug), or dead (expired or
 * rejected, which the gateway will never settle — so it points at the next
 * step instead of leaving a dead end).
 */
export default function MerchantServiceInvoiceDetailPage({ invoiceId }: MerchantServiceInvoiceDetailPageProps) {
  const { data: invoice, isLoading, isError } = useMerchantServiceInvoice(invoiceId);
  const { t } = useTranslation("merchant");
  const subscriptionId = invoice?.subscription?.id;
  const { data: installation, isLoading: loadingInstallation } = useMerchantInstallation(subscriptionId);
  const { data: channels, isLoading: loadingChannels } = useServicePaymentChannels();
  const { mutate: reopenPayment, isPending: isReopening } = usePayServiceInvoice();
  const { mutateAsync: reveal } = useRevealDetail();

  if (isLoading) {
    return <Text variant="small">{t("invoiceDetail.loading")}</Text>;
  }

  if (isError || !invoice) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>{t("invoiceDetail.notFound")}</Heading>
        <Link
          href="/app/payment-admin/services"
          className="underline"
        >
          {t("invoiceDetail.backToServices")}
        </Link>
      </Box>
    );
  }

  const detailColumns: Column<ServiceInstallationDetail>[] = [
    { key: "label", header: t("invoiceDetail.colLabel"), cell: (r) => r.label },
    {
      key: "value",
      header: t("invoiceDetail.colValue"),
      cell: (r) => (
        <SecretValue
          detail={r}
          reveal={reveal}
        />
      ),
    },
  ];

  const isPaid = invoice.status === "PAID";
  // Only an open bill is payable; a rejected or expired one is settled with
  // kita, not with the gateway.
  const isPayable = invoice.status === "UNPAID";
  const isDead = invoice.status === "EXPIRED" || invoice.status === "REJECTED";
  const statusKey = invoiceStatusLabelKey(invoice.status);

  return (
    <Box className="flex max-w-3xl flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-admin/services"
          className="text-sm text-muted-foreground underline"
        >
          {t("invoiceDetail.backToServicesArrow")}
        </Link>
        <Heading level={1}>{invoice.invoice_number}</Heading>
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{invoice.service_name}</Heading>
          {/* Wording, not the raw enum: the client is being billed, not
              reading our database. */}
          <StatusBadge
            status={invoice.status}
            label={statusKey ? t(statusKey) : undefined}
          />
        </Box>
        <Text variant="small">
          {t("invoiceDetail.amountForDays", { amount: money(invoice.amount), count: invoice.duration_days })}
        </Text>
        {invoice.due_at && !isPaid && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {t("invoiceDetail.dueAt", { date: formatDateTime(invoice.due_at) })}
          </Text>
        )}
        {invoice.status === "REJECTED" && invoice.notes && (
          <Text
            variant="small"
            className="text-destructive"
          >
            {t("invoiceDetail.rejected", { notes: invoice.notes })}
          </Text>
        )}
      </Box>

      {isPaid && (
        // Polite, not assertive: this is good news that arrives with the page
        // rather than an interruption, so it must not cut off what is being read.
        <Alert
          role="status"
          className="border-success/40"
        >
          <CheckCircle2
            aria-hidden="true"
            className="text-success"
          />
          <AlertTitle>{t("invoiceDetail.paidTitle")}</AlertTitle>
          <AlertDescription>{t("invoiceDetail.paidDescription")}</AlertDescription>
        </Alert>
      )}

      {invoice.status === "EXPIRED" && (
        <Alert>
          <AlertTitle>{t("invoiceDetail.expiredTitle")}</AlertTitle>
          <AlertDescription>{t("invoiceDetail.expiredDescription")}</AlertDescription>
        </Alert>
      )}

      {isDead && (
        <Link
          href="/app/payment-admin/services"
          className="w-fit"
        >
          <Button variant="outline">{t("invoiceDetail.backToServices")}</Button>
        </Link>
      )}

      {/* Once paid the instructions are noise, and leaving them up invites a
          second payment. */}
      {isPayable && (
        <ServicePaymentCard
          payment={invoice.payment ?? null}
          amount={invoice.amount}
          channels={channels ?? []}
          isLoadingChannels={loadingChannels}
          isReopening={isReopening}
          onReopen={(channel) => reopenPayment({ id: invoice.id, paymentChannelId: channel.id })}
        />
      )}

      {subscriptionId && (
        <>
          <InstallationProgress
            installation={installation}
            isLoading={loadingInstallation}
          />

          <Box className="flex flex-col gap-3">
            <Heading level={3}>{t("invoiceDetail.serviceDetails")}</Heading>
            {(installation?.details.length ?? 0) === 0 ? (
              <Text
                variant="small"
                className="text-muted-foreground"
              >
                {t("invoiceDetail.credentialsPending")}
              </Text>
            ) : (
              <SimpleTable
                columns={detailColumns}
                rows={installation?.details ?? []}
                rowKey={(r) => r.id}
              />
            )}
          </Box>
        </>
      )}
    </Box>
  );
}
