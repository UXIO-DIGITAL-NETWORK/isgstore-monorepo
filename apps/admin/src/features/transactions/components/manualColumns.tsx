import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/utils/currency";
import { formatDateTime } from "@/utils/date";
import { initials } from "@/utils/initials";
import type { Transaction } from "../types/transaction.type";
import { RowActionMenu } from "./RowActionMenu";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { ProviderStatusBadge } from "./ProviderStatusBadge";

/**
 * Manual tab columns — reuses the Automatic shape minus Target (no provider
 * destination for manually-entered transactions) and the callback-only row
 * actions. No reference design exists for Manual yet
 * (product_requirements.md §4.3) — this shape is provisional.
 */
/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const manualColumnsFor = (t: TFunction<"transactions">): ColumnDef<Transaction>[] => [
  {
    accessorKey: "invoice_no",
    header: t("invoiceNo"),
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="text-sm font-medium tabular-nums"
        >
          {row.original.invoice_no}
        </Text>
        {row.original.invoice_ref && (
          <Text
            variant="muted"
            as="span"
          >
            {row.original.invoice_ref}
          </Text>
        )}
      </Box>
    ),
  },
  {
    id: "user",
    header: t("colUser"),
    cell: ({ row }) => {
      const { customer } = row.original;
      return (
        <Box className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarImage
              src={customer.avatar_url}
              alt={customer.name}
            />
            <AvatarFallback>{initials(customer.name)}</AvatarFallback>
          </Avatar>
          <Box className="flex flex-col">
            <Text as="span">{customer.name}</Text>
            <Text
              variant="muted"
              as="span"
            >
              {customer.phone}
            </Text>
            {customer.email && (
              <Text
                variant="muted"
                as="span"
                className="text-xs"
              >
                {customer.email}
              </Text>
            )}
          </Box>
        </Box>
      );
    },
  },
  {
    id: "product",
    header: t("product"),
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text as="span">{row.original.product.name}</Text>
        <Text
          variant="muted"
          as="span"
        >
          {row.original.game.name}
        </Text>
      </Box>
    ),
  },
  {
    id: "cost",
    header: t("colCost"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {formatCurrency(row.original.cost, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    id: "payment_status",
    header: t("capPayment"),
    cell: ({ row }) => <PaymentStatusBadge status={row.original.payment_status} />,
  },
  {
    // Two columns, not two stacked badges. The stack showed both lifecycles
    // already but named neither, so a green "Success" over an amber
    // "Processing" gave an operator no way to tell which half was which.
    id: "provider_status",
    header: t("colProvider"),
    cell: ({ row }) => <ProviderStatusBadge status={row.original.provider_status} />,
  },
  {
    accessorKey: "payment_method",
    header: t("method"),
  },
  {
    id: "time",
    header: t("colTime"),
    cell: ({ row }) => (
      <Text
        variant="muted"
        as="span"
      >
        {formatDateTime(row.original.created_at)}
      </Text>
    ),
  },
  {
    id: "action",
    header: t("colAction"),
    enableSorting: false,
    cell: ({ row }) => (
      <RowActionMenu
        transaction={row.original}
        showCallbackActions={false}
      />
    ),
  },
];
