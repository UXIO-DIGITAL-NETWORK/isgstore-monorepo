import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const LOADING_ROW_COUNT = 5;
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const PAGE_WINDOW = 2;

function pageWindow(page: number, lastPage: number): number[] {
  const start = Math.max(1, page - PAGE_WINDOW);
  const end = Math.min(lastPage, page + PAGE_WINDOW);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface CategoriesTableProps<TData extends { id: string }> {
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
 * Server-mode table for Categories (TanStack Table manual mode —
 * system_architecture.md §4.8). Trimmed from `TransactionsTable`: keeps the
 * checkbox-select column and pagination footer (the reference's
 * interaction pattern), drops sortable headers and dnd-kit drag-to-reorder
 * — neither the reference nor a category taxonomy calls for them.
 * // ponytail: no client sort/reorder for a short taxonomy list; add
 * server-backed sorting if a column ever needs it.
 */
export function CategoriesTable<TData extends { id: string }>({
  columns,
  data,
  isLoading = false,
  isError = false,
  onRetry,
  emptyMessage = "No categories found.",
  page,
  pageSize,
  total,
  lastPage,
  onPageChange,
  onPageSizeChange,
}: CategoriesTableProps<TData>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  useEffect(() => {
    setRowSelection({});
  }, [data]);

  const selectColumn = useMemo<ColumnDef<TData>>(
    () => ({
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? "indeterminate" : false)}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    }),
    [],
  );
  const fullColumns = useMemo<ColumnDef<TData>[]>(() => [selectColumn, ...columns], [selectColumn, columns]);

  const table = useReactTable({
    data,
    columns: fullColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    enableRowSelection: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
  });

  const columnCount = fullColumns.length;
  const from = data.length ? (page - 1) * pageSize + 1 : 0;
  const to = data.length ? from + data.length - 1 : 0;

  if (isError) {
    return (
      <Box className="flex flex-col items-center gap-3 rounded-lg border border-border py-10">
        <Text variant="muted">Something went wrong loading categories.</Text>
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
                {Array.from({ length: columnCount }).map((_, colIndex) => (
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
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
              >
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
          {`${from}-${to} of ${total} categories`}
        </Text>

        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page <= 1}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) onPageChange(page - 1);
                }}
              />
            </PaginationItem>
            {pageWindow(page, lastPage).map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === page}
                  className="tabular-nums"
                  onClick={(event) => {
                    event.preventDefault();
                    onPageChange(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page >= lastPage}
                className={page >= lastPage ? "pointer-events-none opacity-50" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  if (page < lastPage) onPageChange(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </Box>
    </Box>
  );
}
