import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { SubCategoryRowActions } from "./SubCategoryRowActions";
import type { SubCategory } from "../types/subCategory.type";

/**
 * Real columns for the Sub Category list (product_requirements.md §4.5,
 * line 208). Two corrections to the reference: the second column it also
 * labels "Name" holds a currency ("Diamonds"), so it's "Currency Name"; and
 * the Header/Section Type/Reviewer columns behind the open row menu in one
 * frame are the shadcn demo dataset, not this table.
 */
export const subCategoryColumns: ColumnDef<SubCategory>[] = [
  {
    accessorKey: "name",
    header: "Name",
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
    accessorKey: "currency_name",
    header: "Currency Name",
    cell: ({ row }) => <Text as="span">{row.original.currency_name}</Text>,
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
    cell: ({ row }) => {
      const isActive = row.original.status === "active";
      return (
        <Badge
          variant="outline"
          className={cn("capitalize", isActive ? "text-success" : "text-muted-foreground")}
        >
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => <SubCategoryRowActions subCategory={row.original} />,
  },
];
