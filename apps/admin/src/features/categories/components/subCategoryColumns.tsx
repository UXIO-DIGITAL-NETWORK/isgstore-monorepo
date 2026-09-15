import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/date";
import { SubCategoryRowActions } from "./SubCategoryRowActions";
import type { SubCategory } from "../types/subCategory.type";

/**
 * Real columns for the Sub Category list (product_requirements.md §4.5,
 * line 208). Two corrections to the reference: the second column it also
 * labels "Name" holds a currency ("Diamonds"), so it's "Currency Name"; and
 * the Header/Section Type/Reviewer columns behind the open row menu in one
 * frame are the shadcn demo dataset, not this table.
 */
/**
 * A factory, not a module constant: headers are rendered text, so they
 * have to resolve when the component renders.
 */
export const subCategoryColumnsFor = (t: TFunction<"categories">): ColumnDef<SubCategory>[] => [
  {
    accessorKey: "name",
    header: t("name"),
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
    header: t("colCurrencyName"),
    cell: ({ row }) => <Text as="span">{row.original.currency_name}</Text>,
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
    id: "status",
    header: t("status"),
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
    header: t("action"),
    cell: ({ row }) => <SubCategoryRowActions subCategory={row.original} />,
  },
];
