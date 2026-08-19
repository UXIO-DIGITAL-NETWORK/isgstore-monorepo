import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import type { ProviderProduct } from "../types/product.type";
import { ProductPriceCell } from "./ProductPriceCell";
import { ProviderRowActions } from "./ProviderRowActions";

/**
 * Columns for the managed Product Provider table. The `No.` column and the
 * select checkbox (with the System-row lock) are injected by the shared
 * `DataTable`. The price cell reuses `ProductPriceCell` off the mapped variant,
 * so the provider list and the Main Products list read identically.
 */
export const managedProviderColumns: ColumnDef<ProviderProduct>[] = [
  {
    id: "provider",
    header: "Product Provider",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <Box className="flex flex-col">
          <Text as="span" className="font-medium">
            {p.product_name}
          </Text>
          <Text as="span" variant="muted">
            {p.is_system ? "System" : p.supplier_name}
          </Text>
          <Text as="span" variant="muted" className="tabular-nums">
            {p.category_name} · {p.product_code}
          </Text>
        </Box>
      );
    },
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => <ProductPriceCell variants={[row.original.variant]} />,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <Text as="span" className="tabular-nums">
        {format(new Date(row.original.created_at), "d MMM yyyy, HH.mm")}
      </Text>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <Box className="flex flex-col items-start gap-1">
          <Badge
            variant="outline"
            className={
              p.is_active ? "border-success/30 bg-success/10 text-success" : "text-muted-foreground"
            }
          >
            {p.is_active ? "Active" : "Inactive"}
          </Badge>
          {p.is_price_locked && (
            <Badge variant="outline" className="text-muted-foreground">
              Locked
            </Badge>
          )}
        </Box>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ProviderRowActions provider={row.original} />,
  },
];
