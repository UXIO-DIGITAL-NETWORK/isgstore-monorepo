import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";

import { ConfirmInvoiceDialog } from "../components/ConfirmInvoiceDialog";
import { InstallationWorkbench } from "../components/InstallationWorkbench";
import { RejectInvoiceDialog } from "../components/RejectInvoiceDialog";
import { useConfirmServiceInvoice, useFinanceInstallation, useFinanceInvoice } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface FinanceInvoiceDetailPageProps {
  invoiceId: number;
}

/**
 * Where kita reviews a payment and prepares the work behind it.
 *
 * Preparation comes before confirmation on purpose: confirming opens the
 * subscription, and a client whose first view of a paid service is "Instalasi
 * belum dijadwalkan" has been sold something that looks unstarted.
 */
export default function FinanceInvoiceDetailPage({ invoiceId }: FinanceInvoiceDetailPageProps) {
  const [warning, setWarning] = useState(false);

  const { data: invoice, isLoading, isError } = useFinanceInvoice(invoiceId);
  // Same query key as the workbench's, so TanStack dedupes this to one request.
  const scope = { by: "invoice", id: invoiceId } as const;
  const { data: installation } = useFinanceInstallation(scope);
  const { mutate: confirm, isPending: confirming } = useConfirmServiceInvoice();

  if (isLoading) {
    return <Text variant="small">Memuat…</Text>;
  }

  if (isError || !invoice) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>Invoice tidak ditemukan</Heading>
        <Link
          href="/app/payment-internal/invoices"
          className="underline"
        >
          Kembali ke Invoice
        </Link>
      </Box>
    );
  }

  const isPaid = invoice.status === "PAID";
  const payment = invoice.payment ?? null;

  // Phrased as the client will read it, so the warning is accountable to what
  // they actually end up seeing.
  const missing = [
    !installation && "Client akan melihat “Instalasi belum dijadwalkan”.",
    installation && !installation.starts_at && !installation.ends_at && "Rentang jadwal instalasi belum diisi.",
    (installation?.steps.length ?? 0) === 0 && "Client akan melihat “Tahapan instalasi belum disusun”.",
  ].filter(Boolean) as string[];

  const onConfirm = () => {
    if (missing.length > 0) {
      setWarning(true);
      return;
    }

    confirm(invoice.id);
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-internal/invoices"
          className="text-sm text-muted-foreground underline"
        >
          ← Kembali ke Invoice
        </Link>
        <Heading level={1}>{invoice.invoice_number}</Heading>
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{invoice.merchant?.name ?? "Client"}</Heading>
          <StatusBadge status={invoice.status} />
        </Box>
        <Text variant="small">
          {invoice.service_name} · {money(invoice.amount)} untuk {invoice.duration_days} hari
        </Text>
        {invoice.due_at && !isPaid && (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Jatuh tempo {formatDateTime(invoice.due_at)}
          </Text>
        )}
        {invoice.status === "REJECTED" && invoice.notes && (
          <Text
            variant="small"
            className="text-destructive"
          >
            Ditolak: {invoice.notes}
          </Text>
        )}
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Heading level={2}>Pembayaran</Heading>
        {payment ? (
          <>
            <PaymentRow
              label="Metode"
              value={payment.channel ?? "—"}
            />
            <PaymentRow
              label="Nominal"
              value={money(payment.amount)}
            />
            <PaymentRow
              label="Biaya Admin"
              value={money(payment.admin_fee)}
            />
            <PaymentRow
              label="Total"
              value={money(payment.total)}
            />
            <PaymentRow
              label="Status"
              value={payment.status}
            />
            {payment.instructions?.order_no && (
              <PaymentRow
                label="Ref Gateway"
                value={payment.instructions.order_no}
              />
            )}
          </>
        ) : (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Belum ada pembayaran dibuka untuk invoice ini.
          </Text>
        )}
      </Box>

      {/* A prepared install on an unconfirmed invoice is real work, not an
          orphan — but it is invisible to the client until confirmation, and
          that gap is worth stating out loud. */}
      {installation && !isPaid && (
        <Badge
          variant="secondary"
          className="w-fit"
        >
          Instalasi sudah disiapkan · belum aktif untuk client
        </Badge>
      )}

      <InstallationWorkbench scope={scope} />

      {!isPaid && (
        <Box className="flex justify-end gap-2">
          <RejectInvoiceDialog invoice={invoice} />
          <Button
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "Menyimpan…" : "Konfirmasi"}
          </Button>
        </Box>
      )}

      <ConfirmInvoiceDialog
        invoice={invoice}
        missing={missing}
        open={warning}
        onOpenChange={setWarning}
      />
    </Box>
  );
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <Box className="flex items-center justify-between gap-4">
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
