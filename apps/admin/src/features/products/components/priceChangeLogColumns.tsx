import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { PriceChangePairCell } from "./PriceChangePairCell";
import {
  PRICE_CHANGE_STATUS_LABELS,
  type PriceChangeLog,
  type PriceChangeStatus,
} from "../types/product.type";

const STATUS_VARIANT: Record<PriceChangeStatus, "secondary" | "outline" | "destructive"> = {
  applied: "secondary",
  locked: "outline",
  deactivated: "destructive",
  negative_margin: "destructive",
};

/**
 * Columns for the Price Change Log. Read-only: this is the record of what the
 * 5-minute checker did, so there are no row actions. The status column carries
 * the whole point — an admin scans it for `deactivated` / `negative_margin` rows
 * that need handling, versus routine `applied` reprices.
 */
export const priceChangeLogColumns: ColumnDef<PriceChangeLog>[] = [
  {
    accessorKey: "product_name",
    header: "Product",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text as="span" className="font-medium">
          {row.original.product_name}
        </Text>
        <Text as="span" variant="small" className="text-muted-foreground">
          {row.original.buyer_sku_code}
        </Text>
      </Box>
    ),
  },
  {
    id: "cost",
    header: "Cost (modal)",
    cell: ({ row }) => <PriceChangePairCell oldValue={row.original.old_cost} newValue={row.original.new_cost} />,
  },
  {
    id: "member_price",
    header: "Member price",
    cell: ({ row }) => (
      <PriceChangePairCell oldValue={row.original.prices.member.old} newValue={row.original.prices.member.new} />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Box className="flex flex-col gap-1">
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {PRICE_CHANGE_STATUS_LABELS[row.original.status]}
        </Badge>
        {row.original.needs_attention && (
          <Text as="span" variant="small" className="text-destructive">
            Needs attention
          </Text>
        )}
      </Box>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Changed At",
    cell: ({ row }) => (
      <Text as="span" className="tabular-nums">
        {format(new Date(row.original.created_at), "d MMM yyyy, HH.mm")}
      </Text>
    ),
  },
];
