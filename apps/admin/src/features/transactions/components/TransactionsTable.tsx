import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LOADING_ROW_COUNT = 5;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

interface TransactionsTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
  page: number;
  pageSize: number;
  total: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Server-mode table for Transactions (TanStack Table manual mode — data is
 * already the current page's slice from `PaginatedResponse<T>`, no client
 * pagination — system_architecture.md §4.8). Feature-local by design: the
 * dashboard's `DataTable` is client-mode and its column-alignment convention
 * doesn't fit these multi-line cells.
 */
export function TransactionsTable<TData>({
  columns,
  data,
  isLoading = false,
  isError = false,
  onRetry,
  emptyMessage = "No transactions found.",
  page,
  pageSize,
  total,
  lastPage,
  onPageChange,
  onPageSizeChange,
}: TransactionsTableProps<TData>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualPagination: true });
  const columnCount = columns.length;
  const from = data.length ? (page - 1) * pageSize + 1 : 0;
  const to = data.length ? from + data.length - 1 : 0;

  if (isError) {
    return (
      <Box className="flex flex-col items-center gap-3 rounded-lg border border-border py-10">
        <Text variant="muted">Something went wrong loading transactions.</Text>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
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
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Box className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <Box className="flex items-center gap-2">
          <Text variant="small">Rows per page</Text>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              className="w-20"
              aria-label="Rows per page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem
                  key={size}
                  value={String(size)}
                >
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>

        <Text
          variant="small"
          className="tabular-nums"
        >
          {`${from}-${to} of ${total} transactions`}
        </Text>

        <Box className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <Text
            variant="small"
            className="tabular-nums"
          >
            Page {page} of {lastPage}
          </Text>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
