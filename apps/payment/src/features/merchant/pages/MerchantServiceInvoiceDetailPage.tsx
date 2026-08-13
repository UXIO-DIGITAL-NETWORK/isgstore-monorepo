import { Box } from "@/components/common/Box";
import { CopyButton } from "@/components/common/CopyButton";
import { Heading } from "@/components/common/Heading";
import { InstallationProgress } from "@/components/common/InstallationProgress";
import { Link } from "@/components/common/Link";
import { SecretValue } from "@/components/common/SecretValue";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { ServiceInstallationDetail } from "@/types/service.type";

import { UploadProofDialog } from "../components/UploadProofDialog";
import { useMerchantInstallation, useMerchantServiceInvoice, useRevealDetail } from "../hooks/useMerchant";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

interface MerchantServiceInvoiceDetailPageProps {
  invoiceId: number;
}

/**
 * Where a purchase lives after checkout: how to pay, proof of payment, and —
 * once kita confirms — the installation progress and the credentials handed
 * over.
 */
export default function MerchantServiceInvoiceDetailPage({ invoiceId }: MerchantServiceInvoiceDetailPageProps) {
  const { data: invoice, isLoading, isError } = useMerchantServiceInvoice(invoiceId);
  const subscriptionId = invoice?.subscription?.id;
  const { data: installation, isLoading: loadingInstallation } = useMerchantInstallation(subscriptionId);
  const { mutateAsync: reveal } = useRevealDetail();

  if (isLoading) {
    return <Text variant="small">Memuat…</Text>;
  }

  if (isError || !invoice) {
    return (
      <Box className="flex flex-col gap-4">
        <Heading level={1}>Invoice tidak ditemukan</Heading>
        <Link
          href="/app/payment-admin/services"
          className="underline"
        >
          Kembali ke Services
        </Link>
      </Box>
    );
  }

  const detailColumns: Column<ServiceInstallationDetail>[] = [
    { key: "label", header: "Label", cell: (r) => r.label },
    {
      key: "value",
      header: "Nilai",
      cell: (r) => (
        <SecretValue
          detail={r}
          reveal={reveal}
        />
      ),
    },
  ];

  const isPaid = invoice.status === "PAID";
  const canUpload = invoice.status === "UNPAID" || invoice.status === "REJECTED";

  return (
    <Box className="flex max-w-3xl flex-col gap-6">
      <Box className="flex flex-col gap-1">
        <Link
          href="/app/payment-admin/services"
          className="text-sm text-muted-foreground underline"
        >
          ← Kembali ke Services
        </Link>
        <Heading level={1}>{invoice.invoice_number}</Heading>
      </Box>

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Heading level={2}>{invoice.service_name}</Heading>
          <StatusBadge status={invoice.status} />
        </Box>
        <Text variant="small">
          {money(invoice.amount)} untuk {invoice.duration_days} hari
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

      {/* Once paid the instructions are noise, and leaving them up invites a
          second transfer. */}
      {!isPaid && invoice.transfer_instruction && (
        <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <Heading level={3}>Instruksi Transfer</Heading>
          <InstructionRow
            label="Bank"
            value={invoice.transfer_instruction.bank_name}
          />
          <InstructionRow
            label="Nomor Rekening"
            value={invoice.transfer_instruction.account_number}
            copyable
          />
          <InstructionRow
            label="Atas Nama"
            value={invoice.transfer_instruction.account_holder}
          />
          <InstructionRow
            label="Nominal"
            value={String(invoice.amount)}
            display={money(invoice.amount)}
            copyable
          />
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            {invoice.transfer_instruction.note}
          </Text>
        </Box>
      )}

      <Box className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
        <Heading level={3}>Bukti Transfer</Heading>
        {invoice.proof_url ? (
          <Link
            href={invoice.proof_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline"
          >
            Lihat bukti yang sudah diunggah
          </Link>
        ) : (
          <Text
            variant="small"
            className="text-muted-foreground"
          >
            Belum ada bukti transfer.
          </Text>
        )}
        {canUpload && <UploadProofDialog invoice={invoice} />}
      </Box>

      {subscriptionId && (
        <>
          <InstallationProgress
            installation={installation}
            isLoading={loadingInstallation}
          />

          <Box className="flex flex-col gap-3">
            <Heading level={3}>Detail Layanan</Heading>
            {(installation?.details.length ?? 0) === 0 ? (
              <Text
                variant="small"
                className="text-muted-foreground"
              >
                Kredensial akan muncul di sini setelah instalasi berjalan.
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

function InstructionRow({
  label,
  value,
  display,
  copyable = false,
}: {
  label: string;
  value: string;
  display?: string;
  copyable?: boolean;
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
          {display ?? value}
        </Text>
        {copyable && (
          <CopyButton
            value={value}
            label={label}
          />
        )}
      </Box>
    </Box>
  );
}
