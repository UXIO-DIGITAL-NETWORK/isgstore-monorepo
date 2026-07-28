import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Text } from "@/components/common/Text";
import { CategoryProviderRowActions } from "./CategoryProviderRowActions";
import type { CategoryProvider } from "../types/categoryProvider.type";

/**
 * Columns for the Category Provider list (product_requirements.md §4.5,
 * line 241): Provider, Category, Provider Template, Created At, Action.
 * **No Status column** — none of the five reference images shows one, and §6
 * line 286 confirms the entity has no status field.
 *
 * Unlike every sibling tab this is a factory, not a const array: the Category
 * column holds a `category_id` that has to be resolved against the Category
 * tab's own records, so the page passes the lookup in. `No.` and the selection
 * checkbox are injected by `CategoriesTable`, not declared here.
 */
export const categoryProviderColumns = (categoryNameById: Map<string, string>): ColumnDef<CategoryProvider>[] => [
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
    accessorKey: "provider_template",
    header: "Provider Template",
    cell: ({ row }) => <Text as="span">{row.original.provider_template}</Text>,
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
