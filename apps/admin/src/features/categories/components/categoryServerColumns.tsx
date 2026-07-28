import type { ColumnDef } from "@tanstack/react-table";

import { Text } from "@/components/common/Text";
import { CategoryServerRowActions } from "./CategoryServerRowActions";
import type { CategoryServer } from "../types/categoryServer.type";

/** Columns for the Category Server list (product_requirements.md §4.5) —
 * just two here; the leading "No." comes from the table's `showRowNumber`.
 * No Status column: this entity has no active/inactive concept. */
export const categoryServerColumns: ColumnDef<CategoryServer>[] = [
  {
    accessorKey: "name",
    header: "Category Server Name",
    cell: ({ row }) => (
      <Text
        as="span"
        className="font-medium"
      >
        {row.original.name}
      </Text>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => <CategoryServerRowActions categoryServer={row.original} />,
  },
];
