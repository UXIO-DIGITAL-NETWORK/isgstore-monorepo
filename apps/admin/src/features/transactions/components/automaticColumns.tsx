import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Clock } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { initials } from "@/utils/initials";
import { formatElapsed } from "../lib/formatElapsed";
import type { Transaction } from "../types/transaction.type";
import { RowActionMenu } from "./RowActionMenu";
import { StatusBadge } from "./StatusBadge";

/** Automatic tab columns, exact shape from the reference (product_requirements.md §4.3). */
export const automaticColumns: ColumnDef<Transaction>[] = [
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
      <Box className="flex flex-col">
        <Text
          as="span"
          className="tabular-nums"
        >
          {formatCurrency(row.original.cost, { fractionDigits: 0 })}
        </Text>
        {row.original.profit !== undefined && (
          <Text
            variant="muted"
            as="span"
          >
            Profit:{" "}
            <Text
              as="span"
              className="text-success tabular-nums"
            >
              {formatCurrency(row.original.profit, { fractionDigits: 0 })}
            </Text>
          </Text>
        )}
      </Box>
    ),
  },
  {
    accessorKey: "target_ref",
    header: "Target",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text as="span">{row.original.target_ref ?? "—"}</Text>
        {row.original.nickname && (
          <Text as="span" className="text-xs text-muted-foreground">
            {row.original.nickname}
          </Text>
        )}
      </Box>
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
    id: "method",
    header: "Method",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text as="span">{row.original.payment_method}</Text>
        {row.original.admin_fee !== undefined && (
          <Text
            variant="muted"
            as="span"
          >
            Admin fee:{" "}
            <Text
              as="span"
              className="text-warning tabular-nums"
            >
              {formatCurrency(row.original.admin_fee, { fractionDigits: 0 })}
            </Text>
          </Text>
        )}
      </Box>
    ),
  },
  {
    id: "time",
    header: "Time",
    cell: ({ row }) => {
      const tx = row.original;
      const outcomeFailed = tx.invoice_status === "failed";
      const outcomeLabel = outcomeFailed ? "Failed" : "Success";
      return (
        <Box className="flex flex-col gap-1">
          <Text
            variant="muted"
            as="span"
          >
            Created: {format(new Date(tx.created_at), "MMM d, HH:mm")}
          </Text>
          {tx.resolved_at && (
            <Text
              as="span"
              className={outcomeFailed ? "text-destructive" : "text-success"}
            >
              {outcomeLabel}: {format(new Date(tx.resolved_at), "MMM d, HH:mm")}
            </Text>
          )}
          {tx.elapsed_seconds !== undefined && (
            <Badge
              variant="outline"
              className="w-fit gap-1 tabular-nums"
            >
              <Clock className="size-3" />
              {formatElapsed(tx.elapsed_seconds)}
            </Badge>
          )}
        </Box>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    enableSorting: false,
    cell: ({ row }) => <RowActionMenu transaction={row.original} />,
  },
];
