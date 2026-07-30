import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/utils/currency";
import { initials } from "@/utils/initials";
import type { Product } from "../types/product.type";
import { ProductPriceCell } from "./ProductPriceCell";
import { ProductAvailabilityBadge, ProductStatusBadge } from "./ProductStatusBadge";
import { ProductRowActions } from "./ProductRowActions";

/**
 * Columns for the Main Products list (product_requirements.md §4.6). The
 * `No.` column and the select checkbox are injected by the shared `DataTable`,
 * not declared here.
 *
 * `Price` holds the per-variant cost/tier breakdown (`ProductPriceCell`) —
 * the game name it used to show is still searchable but no longer a column.
 */
export const mainProductColumns: ColumnDef<Product>[] = [
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <Box className="flex items-center gap-3">
          {/* No product art ships with this repo, so every fixture falls back
              to an initials tile — squared off, since a circular avatar reads
              as a person rather than an item. */}
          <Avatar className="size-10 rounded-md">
            <AvatarImage
              src={product.image_url}
              alt={product.name}
              className="rounded-md"
            />
            <AvatarFallback className="rounded-md text-xs">{initials(product.name)}</AvatarFallback>
          </Avatar>
          <Box className="flex flex-col">
            <Text
              as="span"
              className="font-medium"
            >
              {product.name}
            </Text>
            <Text
              variant="muted"
              as="span"
            >
              {product.category_name}
            </Text>
            <Text
              variant="muted"
              as="span"
              className="tabular-nums"
            >
              {product.code}
            </Text>
          </Box>
        </Box>
      );
    },
  },
  {
    id: "variant",
    header: "Variant",
    cell: ({ row }) => (
      <Box className="flex flex-col gap-1">
        {row.original.variants.map((variant) => (
          <Box
            key={variant.id}
            className="flex flex-col"
          >
            <Text as="span">{variant.name}</Text>
            <Box className="flex items-center gap-2">
              <Text
                as="span"
                className="text-muted-foreground tabular-nums"
              >
                {formatCurrency(variant.prices.public, { fractionDigits: 0 })}
              </Text>
              <ProductStatusBadge status={variant.status} />
            </Box>
          </Box>
        ))}
      </Box>
    ),
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) => <ProductPriceCell variants={row.original.variants} />,
  },
  {
    accessorKey: "created_at",
    header: "Created At",
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {format(new Date(row.original.created_at), "d MMM yyyy, HH.mm")}
      </Text>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Box className="flex flex-col items-start gap-1">
        <ProductStatusBadge status={row.original.status} />
        <ProductAvailabilityBadge isAvailable={row.original.is_available} />
      </Box>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ProductRowActions product={row.original} />,
  },
];
