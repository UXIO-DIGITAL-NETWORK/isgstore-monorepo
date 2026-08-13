import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Link } from "@/components/common/Link";
import { Pager } from "@/components/common/Pager";
import { SimpleTable, type Column } from "@/components/common/SimpleTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Text } from "@/components/common/Text";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import type { ServiceInvoice } from "@/types/service.type";

import { ConfirmServiceInvoiceDialog } from "../components/ConfirmServiceInvoiceDialog";
import { useServiceInvoices } from "../hooks/useFinance";

const money = (v: number) => formatCurrency(v, { fractionDigits: 0 });

/** "" = all; the rest map straight onto ListParams.status. */
const FILTERS = [
  { value: "", label: "Semua" },
  { value: "WAITING_CONFIRMATION", label: "Menunggu Konfirmasi" },
  { value: "UNPAID", label: "Belum Bayar" },
  { value: "PAID", label: "Lunas" },
  { value: "REJECTED", label: "Ditolak" },
];

const columns: Column<ServiceInvoice>[] = [
  {
    key: "invoice",
    header: "No. Invoice",
    cell: (r) => (
      <Text
        as="span"
        className="font-medium"
      >
        {r.invoice_number}
      </Text>
    ),
  },
  { key: "merchant", header: "Client", cell: (r) => r.merchant?.name ?? "-" },
  { key: "service", header: "Service", cell: (r) => r.service_name },
  { key: "amount", header: "Nominal", className: "text-right tabular-nums", cell: (r) => money(r.amount) },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  {
    key: "proof",
    header: "Bukti",
    cell: (r) =>
      r.proof_url ? (
        <Link
          href={r.proof_url}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Lihat
        </Link>
      ) : (
        <Text
          as="span"
          className="text-muted-foreground"
        >
          —
        </Text>
      ),
  },
  { key: "due", header: "Jatuh Tempo", cell: (r) => formatDateTime(r.due_at) },
  {
    key: "actions",
    header: "Aksi",
    // Only a proof awaiting review is actionable; everything else is history.
    cell: (r) =>
      r.status === "WAITING_CONFIRMATION" ? (
        <ConfirmServiceInvoiceDialog invoice={r} />
      ) : (
        <Text
          as="span"
          className="text-muted-foreground"
        >
          —
        </Text>
      ),
  },
];

export default function FinanceInvoicesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const { data, isLoading, isError } = useServiceInvoices({
    page,
    per_page: 20,
    ...(status ? { status } : {}),
  });

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Invoice</Heading>

      <Tabs
        value={status}
        onValueChange={(next) => {
          setStatus(next);
          // A filter change re-scopes the list, so page 3 of the old filter is
          // meaningless against the new one.
          setPage(1);
        }}
      >
        <TabsList>
          {FILTERS.map((filter) => (
            <TabsTrigger
              key={filter.value || "all"}
              value={filter.value}
            >
              {filter.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SimpleTable
        columns={columns}
        rows={data?.rows ?? []}
        isLoading={isLoading}
        isError={isError}
        emptyLabel="Belum ada invoice"
        rowKey={(r) => r.id}
      />

      <Pager
        page={data?.page ?? page}
        lastPage={data?.lastPage ?? 1}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </Box>
  );
}
