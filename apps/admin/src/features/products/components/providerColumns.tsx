import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/currency";
import type { UxiotopupPriceListItem } from "../types/product.type";
import { ProductAvailabilityBadge } from "./ProductStatusBadge";

/**
 * Columns for the Uxiotopup price list (Product Provider tab). The `No.` column
 * and the select checkbox are injected by the shared `DataTable`. The action
 * column lifts the row up via `onAdd` so the page can own the add dialog, and
 * is disabled once a SKU is already mapped to one of our products.
 */
export const providerColumns = (
  onAdd: (item: UxiotopupPriceListItem) => void,
): ColumnDef<UxiotopupPriceListItem>[] => [
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Box className="flex flex-col">
          <Text
            as="span"
            className="font-medium"
          >
            {item.name}
          </Text>
          <Text
            as="span"
            variant="muted"
            className="tabular-nums"
          >
            {item.buyer_sku_code}
          </Text>
        </Box>
      );
    },
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => <Text as="span">{row.original.category}</Text>,
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
    id: "availability",
    header: "Availability",
    cell: ({ row }) => <ProductAvailabilityBadge isAvailable={row.original.available} />,
  },
  {
    id: "mapped",
    header: "Mapped",
    cell: ({ row }) =>
      row.original.already_mapped ? (
        <Badge
          variant="outline"
          className="border-success/30 bg-success/10 text-success"
        >
          Mapped
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="text-muted-foreground"
        >
          Not mapped
        </Badge>
      ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Can permission="products.create">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={item.already_mapped}
            onClick={() => onAdd(item)}
          >
            {item.already_mapped ? "Added" : "Add to products"}
          </Button>
        </Can>
      );
    },
  },
];
