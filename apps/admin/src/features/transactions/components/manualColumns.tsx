import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/utils/currency";
import { initials } from "@/utils/initials";
import type { Transaction } from "../types/transaction.type";
import { RowActionMenu } from "./RowActionMenu";
import { StatusBadge } from "./StatusBadge";

/**
 * Manual tab columns — reuses the Automatic shape minus Target (no provider
 * destination for manually-entered transactions) and the callback-only row
 * actions. No reference design exists for Manual yet
 * (product_requirements.md §4.3) — this shape is provisional.
 */
export const manualColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "invoice_no",
    header: "Invoice No.",
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
    header: "User",
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
    header: "Product",
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
    header: "Cost",
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
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Box className="flex flex-col items-start gap-1">
        <StatusBadge status={row.original.payment_status} />
        <StatusBadge status={row.original.invoice_status} />
      </Box>
    ),
  },
  {
    accessorKey: "payment_method",
    header: "Method",
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => (
      <Text
        variant="muted"
        as="span"
      >
        {format(new Date(row.original.created_at), "MMM d, HH:mm")}
      </Text>
    ),
  },
  {
    id: "action",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => (
      <RowActionMenu
        transaction={row.original}
        showCallbackActions={false}
      />
    ),
  },
];
