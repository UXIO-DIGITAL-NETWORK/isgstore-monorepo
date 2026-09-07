import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Badge } from "@/components/ui/badge";
import { CategoryProviderRowActions } from "./CategoryProviderRowActions";
import type { ProviderCategoryOption } from "../hooks/useProviderCategoryOptions";
import type { CategoryProvider } from "../types/categoryProvider.type";

/** Matched on the name, as the provider pipeline itself does. */
const INTEGRATED_PROVIDER = "uxiolabs";

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
): ColumnDef<CategoryProvider>[] => [
  {
    accessorKey: "provider_name",
    header: "Provider",
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
    header: "Category",
    // Falls back to the raw id rather than rendering blank, so a provider
    // pointing at a deleted category stays visible and diagnosable.
    cell: ({ row }) => (
      <Text as="span">{categoryNameById.get(row.original.category_id) ?? row.original.category_id}</Text>
    ),
  },
  {
    accessorKey: "provider_category",
    header: "Provider Category",
    cell: ({ row }) => {
      const meta = providerCategoryMeta.get(row.original.provider_category);
      // Only reconcile rows whose provider actually has a catalogue; anything
      // else would be flagged unmatched purely for having no list to match against.
      const isIntegrated = row.original.provider_name.toLowerCase() === INTEGRATED_PROVIDER;
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
            >
              Unmatched
            </Badge>
          )}
        </Box>
      );
    },
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
    id: "actions",
    header: "Action",
    cell: ({ row }) => <CategoryProviderRowActions categoryProvider={row.original} />,
  },
];
