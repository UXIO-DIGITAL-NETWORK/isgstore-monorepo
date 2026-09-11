import { useTranslation } from "react-i18next";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const LOADING_ROW_COUNT = 5;

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
}

/**
 * Generic client-side table (no server pagination — every consumer today has
 * a short fixture array). Feature-local for now; promote to `components/common`
 * if a second feature needs server-mode pagination on top of this shape.
 */
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  onRetry,
  emptyMessage = "No data available.",
}: DataTableProps<TData>) {
  const { t } = useTranslation("dashboard");
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const columnCount = columns.length;

  if (isError) {
    return (
      <Box className="flex flex-col items-center gap-3 rounded-lg border border-border py-10">
        <Text variant="muted">{t("tableFailed")}</Text>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
          >{t("retry")}</Button>
        )}
      </Box>
    );
  }

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header, index) => (
              <TableHead
                key={header.id}
                className={cn("h-11", index > 0 && "text-right")}
              >
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: LOADING_ROW_COUNT }).map((_, rowIndex) => (
            <TableRow key={`skeleton-${rowIndex}`}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columnCount}
              className="py-8 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(index > 0 && "text-right")}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
