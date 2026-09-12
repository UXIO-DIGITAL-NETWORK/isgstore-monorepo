import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import type { ServiceBatchPayment } from "@/types/service.type";

import { ServicePaymentCard } from "../components/ServicePaymentCard";
import { useServicePayment, useServicePaymentChannels } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

type CoveredBill = ServiceBatchPayment["invoices"][number];

/**
 * One payment attempt and every bill it settles.
 *
 * Deliberately its own page rather than one of the bills' detail pages: showing
 * a batch's QR under a single invoice would say that invoice costs the batch
 * total — the same misattribution the schema was changed to avoid, only in the
 * UI. Here the total belongs to the page and each bill shows its own share.
 */
export default function MerchantServiceBatchPaymentPage({ reference }: { reference: string }) {
  const { t } = useTranslation("merchant");
  const { data: attempt, isLoading, isError } = useServicePayment(reference);
  const { data: channels, isLoading: loadingChannels } = useServicePaymentChannels();

  if (isLoading) {
    return <Text variant="small">{t("invoiceDetail.loading")}</Text>;
  }

  if (isError || !attempt) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>{t("invoiceDetail.notFound")}</Heading>
        <Link href="/app/payment-admin/services" className="underline">
          {t("invoiceDetail.backToServices")}
        </Link>
      </Box>
    );
  }

  const columns: Column<CoveredBill>[] = [
    {
      key: "invoice",
      header: t("services.colInvoice"),
      cell: (r) => (
        <Link href={`/app/payment-admin/service-invoices/${r.id}`} className="font-medium underline">
          {r.invoice_number}
        </Link>
      ),
    },
    { key: "service", header: t("services.colService"), cell: (r) => r.service_name },
    {
      key: "amount",
      header: t("services.colAmount"),
      className: "text-right tabular-nums",
      // This bill's own figure. The fee below is charged once for the set, so
      // these deliberately do not add up to what was paid.
      cell: (r) => money(r.amount),
    },
    { key: "status", header: t("services.colStatus"), cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Heading level={1}>{t("batchPayment.title")}</Heading>
        <Text variant="small" className="text-muted-foreground">
          {t("batchPayment.covers", { count: attempt.invoice_count })} · {attempt.reference_id}
        </Text>
      </Box>

      <ServicePaymentCard
        payment={{
          channel: attempt.channel,
          channel_code: attempt.channel_code,
          type: attempt.type,
          amount: attempt.amount,
          admin_fee: attempt.admin_fee,
          total: attempt.total,
          status: attempt.status,
          expires_at: attempt.expires_at,
          is_expired: attempt.is_expired,
          instructions: attempt.instructions,
        }}
        amount={attempt.amount}
        channels={channels ?? []}
        isLoadingChannels={loadingChannels}
        // A lapsed batch is re-opened from the bills tab, where the client can
        // also change which bills are included. Re-opening it blind here would
        // silently re-bill a set they may have already part-paid.
        onReopen={() => undefined}
      />

      <Box className="flex flex-col gap-2">
        <Heading level={2}>{t("batchPayment.billsCovered")}</Heading>
        <SimpleTable columns={columns} rows={attempt.invoices} rowKey={(r) => r.id} />
        <Box className="flex justify-between border-t border-border pt-2">
          <Text as="span" variant="small" className="text-muted-foreground">
            {t("bills.feeOnce")}
          </Text>
          <Text as="span" className="tabular-nums">{money(attempt.admin_fee)}</Text>
        </Box>
        <Box className="flex justify-between font-medium">
          <Text as="span">{t("bills.total")}</Text>
          <Text as="span" className="tabular-nums">{money(attempt.total)}</Text>
        </Box>
      </Box>
    </Box>
  );
}
