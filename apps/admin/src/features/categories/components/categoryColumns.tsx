import type { ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { CategoryRowActions } from "./CategoryRowActions";
import { CategoryStatusToggle } from "./CategoryStatusToggle";
import type { Category } from "../types/category.type";

/** Real columns for the Category list — the reference's Header/Section
 * Type/Status/Target/Limit/Reviewer columns are the unrelated shadcn demo
 * dataset and are not reproduced (product_requirements.md §4.5). */
export const categoryColumns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium"
        >
          {row.original.name}
        </Text>
        {row.original.sub_name && <Text variant="muted">{row.original.sub_name}</Text>}
      </Box>
    ),
  },
  {
    accessorKey: "type",
    header: "Category Type",
    cell: ({ row }) => <Text as="span">{row.original.type}</Text>,
  },
  {
    id: "code_slug",
    header: "Code / Slug",
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium tabular-nums"
        >
          {row.original.code}
        </Text>
        <Text variant="muted">{row.original.slug}</Text>
      </Box>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => <CategoryStatusToggle category={row.original} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CategoryRowActions category={row.original} />,
  },
];
