import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/date";
import { CategoryProviderRowActions } from "./CategoryProviderRowActions";
import type { ProviderCategoryOption } from "../hooks/useProviderCategoryOptions";
import type { CategoryProvider } from "../types/categoryProvider.type";

/**
 * Matched on the name, as the provider pipeline itself does. Every spelling that
 * name has ever had: it is stored data ("Uxiotopup" again after a rename), and a
 * miss here silently stops the Provider Category column from being reconciled.
 */
const INTEGRATED_PROVIDERS = ["uxiotopup", "uxiolabs"];

/**
 * Columns for the Category Provider list: Provider, Category, Provider Category,
 * Created At, Action. **No Status column** — the entity has no status field.
 *
 * A factory, not a const array: the Category column resolves a `category_id`
 * against the Category tab's records, and the Provider Category column is
 * reconciled against the provider's live catalogue so a mapping that no longer
 * matches anything is visible rather than silently dead. `No.` and the selection
 * checkbox are injected by the shared `DataTable`.
 */
export const categoryProviderColumns = (
  categoryNameById: Map<string, string>,
  providerCategoryMeta: Map<string, ProviderCategoryOption> = new Map(),
  t: TFunction<"categories">,
): ColumnDef<CategoryProvider>[] => [
  {
    accessorKey: "provider_name",
    header: t("provider"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="font-medium"
      >
        {row.original.provider_name}
      </Text>
    ),
  },
  {
    accessorKey: "category_id",
    header: t("category"),
    // Falls back to the raw id rather than rendering blank, so a provider
    // pointing at a deleted category stays visible and diagnosable.
    cell: ({ row }) => (
      <Text as="span">{categoryNameById.get(row.original.category_id) ?? row.original.category_id}</Text>
    ),
  },
  {
    accessorKey: "provider_category",
    header: t("colProviderCategory"),
    cell: ({ row }) => {
      const meta = providerCategoryMeta.get(row.original.provider_category);
      // Only reconcile rows whose provider actually has a catalogue; anything
      // else would be flagged unmatched purely for having no list to match against.
      const isIntegrated = INTEGRATED_PROVIDERS.includes(row.original.provider_name.toLowerCase());
      const canReconcile = isIntegrated && providerCategoryMeta.size > 0;

      return (
        <Box className="flex flex-col gap-1">
          <Text as="span">{row.original.provider_category}</Text>

          {meta && (
            <Text
              as="span"
              variant="small"
              className="text-muted-foreground tabular-nums"
            >
              {meta.available_count} of {meta.sku_count} SKUs active
            </Text>
          )}

          {canReconcile && !meta && (
            <Badge
              variant="destructive"
              className="w-fit"
            >{t("unmatched")}</Badge>
          )}
        </Box>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: t("colCreatedAt"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {formatDateTime(row.original.created_at)}
      </Text>
    ),
  },
  {
    id: "actions",
    header: t("action"),
    cell: ({ row }) => <CategoryProviderRowActions categoryProvider={row.original} />,
  },
];
