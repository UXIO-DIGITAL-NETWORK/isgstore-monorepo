import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import type { PoolCandidate } from "../types/product.type";

/**
 * Columns for the Add panel's candidate list.
 *
 * The state column is the whole point of the panel: an already-pooled SKU stays
 * visible (so the admin can see the catalogue is covered) but is not selectable,
 * which is what stops the same SKU being added twice.
 */
/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const poolCandidateColumnsFor = (t: TFunction<"products">): ColumnDef<PoolCandidate>[] => [
  {
    accessorKey: "name",
    header: t("colService"),
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.name}
        </Text>
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          {row.original.buyer_sku_code}
        </Text>
      </Box>
    ),
  },
  {
    accessorKey: "provider_category",
    header: t("colProviderCategoryHeader"),
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text as="span">{row.original.provider_category}</Text>
        <Text
          as="span"
          variant="small"
          className="text-muted-foreground"
        >
          → {row.original.mapped_category_name ?? "—"}
        </Text>
      </Box>
    ),
  },
  {
    accessorKey: "cost",
    header: t("cost"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {formatCurrency(row.original.cost)}
      </Text>
    ),
  },
  {
    id: "state",
    header: t("colState"),
    cell: ({ row }) => {
      const { already_promoted, already_pooled, is_new, available } = row.original;

      return (
        <Box className="flex flex-wrap items-center gap-1.5">
          {already_promoted && <Badge variant="secondary">{t("inCatalogue")}</Badge>}
          {already_pooled && !already_promoted && <Badge variant="secondary">{t("inPool")}</Badge>}
          {!already_pooled && is_new && <Badge variant="outline">{t("newBadge")}</Badge>}
          {!available && <Badge variant="destructive">{t("unavailable")}</Badge>}
        </Box>
      );
    },
  },
];
