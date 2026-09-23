import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatWib } from "@/utils/date";
import { MarketingRowActions } from "./MarketingRowActions";
import type { FlashSale, Promo } from "../types/marketing.type";

const dateCell = (value?: string) => (
  <Text
    as="span"
    className="tabular-nums"
  >
    {value ? formatDate(value) : "—"}
  </Text>
);

export const promoColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
  t: TFunction<"marketing">,
): ColumnDef<Promo>[] => [
  {
    accessorKey: "code",
    header: t("colCode"),
    cell: ({ row }) => (
      <Box className="flex flex-col">
        <Text
          as="span"
          className="font-medium tracking-wider"
        >
          {row.original.code}
        </Text>
        <Text
          variant="muted"
          as="span"
        >
          {row.original.name}
        </Text>
      </Box>
    ),
  },
  {
    id: "discount",
    header: t("colDiscount"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {row.original.type === "percentage"
          ? `${row.original.value}%`
          : formatCurrency(row.original.value, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    id: "min_purchase",
    header: t("colMinPurchase"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {formatCurrency(row.original.min_purchase, { fractionDigits: 0 })}
      </Text>
    ),
  },
  {
    id: "usage",
    header: t("colUsed"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {row.original.used_count}
        {row.original.quota_total ? ` / ${row.original.quota_total}` : ""}
      </Text>
    ),
  },
  { id: "ends_at", header: t("colEnds"), cell: ({ row }) => dateCell(row.original.ends_at) },
  {
    id: "visibility",
    header: t("colVisibility"),
    cell: ({ row }) => (
      // A private code still works when typed — it is simply not advertised.
      <Badge
        variant="outline"
        className={cn(row.original.is_public ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_public ? "Public" : "Private"}
      </Badge>
    ),
  },
  {
    id: "status",
    header: t("colStatus"),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(row.original.is_active ? "text-success" : "text-muted-foreground")}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <MarketingRowActions
        id={row.original.id}
        label={row.original.code}
        entityLabel={t("promoEntity")}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    ),
  },
];

export const flashSaleColumns = (
  onDelete: (ids: string[]) => void,
  onEdit: (id: string) => void,
  t: TFunction<"marketing">,
): ColumnDef<FlashSale>[] => [
  {
    accessorKey: "name",
    header: t("colName"),
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
    id: "window",
    header: t("colWindow"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {formatWib(row.original.starts_at, "d MMM")} – {formatWib(row.original.ends_at, "d MMM yyyy")}
      </Text>
    ),
  },
  {
    id: "items",
    header: t("colProducts"),
    cell: ({ row }) => (
      <Text
        as="span"
        className="tabular-nums"
      >
        {row.original.items.length}
      </Text>
    ),
  },
  {
    id: "stock",
    header: t("colStockSold"),
    cell: ({ row }) => {
      const sold = row.original.items.reduce((total, item) => total + item.stock_sold, 0);
      const stock = row.original.items.reduce((total, item) => total + item.stock_total, 0);
      return (
        <Text
          as="span"
          className="tabular-nums"
        >
          {sold} / {stock}
        </Text>
      );
    },
  },
  {
    id: "status",
    header: t("colStatus"),
    cell: ({ row }) => {
      // Three states, not two: an active sale can still be scheduled or over.
      const label = row.original.is_running ? "Running" : row.original.is_active ? "Scheduled" : "Inactive";
      return (
        <Badge
          variant="outline"
          className={cn(row.original.is_running ? "text-success" : "text-muted-foreground")}
        >
          {label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <MarketingRowActions
        id={row.original.id}
        label={row.original.name}
        entityLabel={t("flashSaleEntity")}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    ),
  },
];
