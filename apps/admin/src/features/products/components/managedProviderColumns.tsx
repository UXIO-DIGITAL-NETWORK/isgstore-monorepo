import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { POOL_STATE_LABELS, type ProviderProduct } from "../types/product.type";
import { ProductPriceCell } from "./ProductPriceCell";
import { ProviderRowActions } from "./ProviderRowActions";

/**
 * Columns for the managed Product Provider table. The `No.` column and the
 * select checkbox (with the System-row lock) are injected by the shared
 * `DataTable`. The price cell reuses `ProductPriceCell` off the mapped variant,
 * so the provider list and the Main Products list read identically.
 */
/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const managedProviderColumnsFor = (t: TFunction<"products">): ColumnDef<ProviderProduct>[] => [
  {
    id: "provider",
    header: t("colProductProvider"),
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
    header: t("price"),
    cell: ({ row }) => (
      <Box className="flex flex-col gap-1">
        <ProductPriceCell variants={[row.original.variant]} />
        {row.original.is_price_preview && (
          <Text as="span" variant="small" className="text-muted-foreground">{t("projectedFromMargin")}</Text>
        )}
      </Box>
    ),
  },
  {
    accessorKey: "created_at",
    header: t("createdAt"),
    cell: ({ row }) => (
      <Text as="span" className="tabular-nums">
        {format(new Date(row.original.created_at), "d MMM yyyy, HH.mm")}
      </Text>
    ),
  },
  {
    id: "status",
    header: t("status"),
    cell: ({ row }) => {
      const p = row.original;
      // The pipeline stage replaces the bare active/inactive pill: "Inactive"
      // was true of a pooled row, a draft and a retired product alike, which
      // told an admin nothing about what to do next.
      const stageClass =
        p.pool_state === "published"
          ? "border-success/30 bg-success/10 text-success"
          : p.pool_state === "ready"
            ? "border-chart-1/30 bg-chart-1/10 text-chart-1"
            : "text-muted-foreground";

      return (
        <Box className="flex flex-col items-start gap-1">
          <Badge variant="outline" className={stageClass}>
            {POOL_STATE_LABELS[p.pool_state]}
          </Badge>
          {p.is_price_locked && (
            <Badge variant="outline" className="text-muted-foreground">{t("locked")}</Badge>
          )}
          {!p.is_available && <Badge variant="destructive">{t("unavailable")}</Badge>}
        </Box>
      );
    },
  },
  {
    id: "action",
    header: t("action"),
    cell: ({ row }) => <ProviderRowActions provider={row.original} />,
  },
];
