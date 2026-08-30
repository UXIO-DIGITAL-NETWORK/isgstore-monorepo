import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { formatCurrency } from "@/utils/currency";
import type { Refund } from "../types/refund.type";
import { RefundMethodBadge, RefundStatusBadge } from "./RefundStatusBadge";
import { RowActionMenu } from "./RowActionMenu";

const formatDate = (value: string | null) => (value ? format(new Date(value), "dd MMM yyyy HH:mm") : "—");

export const refundColumns: ColumnDef<Refund>[] = [
  {
    accessorKey: "refund_number",
    header: "Refund",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="text-sm font-medium tabular-nums"
        >
          {row.original.refund_number}
        </Text>
        <Text
          variant="muted"
          as="span"
          className="tabular-nums"
        >
          {row.original.transaction.invoice_number ?? "—"}
        </Text>
      </Box>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const { customer, claim_notified_at, method } = row.original;
      // A guest we could never reach has to stand out: nobody will ever fill in
      // the payout details, so the row waits forever unless an admin chases it.
      const unreachable = method === "manual_transfer" && claim_notified_at === null;

      return (
        <Box className="flex flex-col">
          <Text as="span">{customer.name ?? (customer.is_guest ? "Guest" : "—")}</Text>
          <Text
            variant="muted"
            as="span"
          >
            {customer.email ?? "no email"}
          </Text>
          <Text
            variant="muted"
            as="span"
            className="text-xs tabular-nums"
          >
            {customer.phone ?? "no phone"}
          </Text>
          {unreachable && (
            <Box className="mt-1 flex items-center gap-1">
              <AlertTriangle className="text-destructive size-3" />
              <Text
                as="span"
                className="text-destructive text-xs"
              >
                Never notified — contact manually
              </Text>
            </Box>
          )}
        </Box>
      );
    },
  },
  {
    id: "method",
    header: "Method",
    cell: ({ row }) => <RefundMethodBadge method={row.original.method} />,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <Text
        as="span"
        className="text-sm font-medium tabular-nums"
      >
        {formatCurrency(row.original.amount, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    id: "payout",
    header: "Payout to",
    cell: ({ row }) => {
      const { payout, method } = row.original;

      if (method === "balance") {
        return (
          <Text
            variant="muted"
            as="span"
          >
            Member balance
          </Text>
        );
      }

      if (!payout) {
        return (
          <Text
            variant="muted"
            as="span"
          >
            Awaiting the customer
          </Text>
        );
      }

      return (
        <Box className="flex flex-col">
          <Text
            as="span"
            className="text-sm"
          >
            {payout.bank_name ?? payout.bank_code}
          </Text>
          <Text
            variant="muted"
            as="span"
            className="tabular-nums"
          >
            {payout.account_number ?? payout.account_phone ?? "—"}
          </Text>
          <Text
            variant="muted"
            as="span"
            className="text-xs"
          >
            {payout.account_name}
          </Text>
        </Box>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Box className="flex flex-col gap-1">
        <RefundStatusBadge status={row.original.status} />
        {row.original.processed_by && (
          <Text
            variant="muted"
            as="span"
            className="text-xs"
          >
            {row.original.processed_by}
          </Text>
        )}
      </Box>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Opened",
    cell: ({ row }) => (
      <Text
        variant="muted"
        as="span"
        className="tabular-nums"
      >
        {formatDate(row.original.created_at)}
      </Text>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <RowActionMenu refund={row.original} />,
  },
];
