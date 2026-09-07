import type { ColumnDef } from "@tanstack/react-table";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { CategoryTypeRowActions } from "./CategoryTypeRowActions";
import type { CategoryType } from "../types/categoryType.type";

/**
 * Columns for the Category Type list (product_requirements.md §4.5).
 *
 * Status is `active | inactive` only — the reference's own screenshots
 * disagree ("Active" in one, "In Process" in the other for the same rows),
 * and "In Process" is the shadcn demo dataset's review-workflow vocabulary,
 * not a taxonomy state.
 */
export const categoryTypeColumns: ColumnDef<CategoryType>[] = [
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
    accessorKey: "is_voucher",
    header: "Voucher",
    // The mark is decorative; the cell's accessible name comes from the
    // sr-only text, so the column isn't icon-only for screen readers
    // (.claude/rules/accessibility.md).
    cell: ({ row }) => (
      <Box className="flex items-center">
        {row.original.is_voucher ? (
          <Check
            className="size-4 text-success"
            aria-hidden
          />
        ) : (
          <Text
            as="span"
            className="text-muted-foreground"
            aria-hidden
          >
            —
          </Text>
        )}
        <Text
          as="span"
          className="sr-only"
        >
          {row.original.is_voucher ? "Yes" : "No"}
        </Text>
      </Box>
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
    cell: ({ row }) => <CategoryTypeRowActions categoryType={row.original} />,
  },
];
