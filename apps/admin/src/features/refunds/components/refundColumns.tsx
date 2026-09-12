import type { TFunction } from "i18next";
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

/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const refundColumnsFor = (t: TFunction<"refunds">): ColumnDef<Refund>[] => [
  {
    accessorKey: "refund_number",
    header: t("refundFallback"),
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
    header: t("customer"),
    cell: ({ row }) => {
      const { customer, claim_notified_at, method, claimed_account } = row.original;
      // A guest we could never reach has to stand out: they will never claim,
      // so the row waits forever unless an admin chases it by hand. True on
      // both guest schemes — a claim link nobody received is as dead as an
      // unanswered request for bank details.
      const unreachable = (method === "manual_transfer" || method === "balance_claim") && claim_notified_at === null;

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
          {/* The comparison the admin verifies against. Shown inline so a
              mismatch is visible while scanning the queue, not only after
              opening a dialog. */}
          {claimed_account && (
            <Box className="border-border mt-1 flex flex-col border-l pl-2">
              <Text
                as="span"
                className="text-xs font-medium"
              >
                Claimed by {claimed_account.name ?? "—"}
              </Text>
              <Text
                variant="muted"
                as="span"
                className="text-xs"
              >
                {claimed_account.email ?? claimed_account.phone ?? "—"}
              </Text>
              {claimed_account.sibling_claims > 0 && (
                <Text
                  as="span"
                  className="text-warning text-xs"
                >
                  {claimed_account.sibling_claims} other claim
                  {claimed_account.sibling_claims === 1 ? "" : "s"}
                </Text>
              )}
            </Box>
          )}
          {unreachable && (
            <Box className="mt-1 flex items-center gap-1">
              <AlertTriangle className="text-destructive size-3" />
              <Text
                as="span"
                className="text-destructive text-xs"
              >{t("neverNotified")}</Text>
            </Box>
          )}
        </Box>
      );
    },
  },
  {
    id: "method",
    header: t("method"),
    cell: ({ row }) => <RefundMethodBadge method={row.original.method} />,
  },
  {
    accessorKey: "amount",
    header: t("amount"),
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
    header: t("colPayoutTo"),
    cell: ({ row }) => {
      const { payout, method } = row.original;

      if (method === "balance") {
        return (
          <Text
            variant="muted"
            as="span"
          >{t("memberBalance")}</Text>
        );
      }

      if (method === "balance_claim") {
        return (
          <Text
            variant="muted"
            as="span"
          >
            {row.original.claimed_account ? "Claimed account balance" : "Awaiting an account"}
          </Text>
        );
      }

      if (!payout) {
        return (
          <Text
            variant="muted"
            as="span"
          >{t("awaitingCustomer")}</Text>
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
    header: t("status"),
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
    id: "verify_due_at",
    header: t("colDue"),
    cell: ({ row }) => {
      const { verify_due_at, is_overdue } = row.original;

      // No deadline until the customer claims: an unclaimed refund is waiting
      // on them, and putting our own clock on their inaction would report every
      // outstanding row as late forever.
      if (!verify_due_at) {
        return (
          <Text
            variant="muted"
            as="span"
          >
            —
          </Text>
        );
      }

      return (
        <Box className="flex flex-col">
          <Text
            as="span"
            className={is_overdue ? "text-destructive text-sm tabular-nums" : "text-sm tabular-nums"}
          >
            {formatDate(verify_due_at)}
          </Text>
          {is_overdue && (
            <Text
              as="span"
              className="text-destructive text-xs"
            >{t("pastPromise")}</Text>
          )}
        </Box>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: t("opened"),
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
