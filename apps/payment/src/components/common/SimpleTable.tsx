import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  cell: (row: T) => ReactNode;
}

interface SimpleTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  isError?: boolean;
  emptyLabel?: string;
  rowKey: (row: T) => string | number;
}

/**
 * A minimal server-mode table with loading / empty / error states. Pagination
 * is driven by the page, not this component — it only renders the current page.
 */
export function SimpleTable<T>({
  columns,
  rows,
  isLoading = false,
  isError = false,
  emptyLabel,
  rowKey,
}: SimpleTableProps<T>) {
  const { t } = useTranslation("common");

  return (
    <Box className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.className}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center"
              >
                <Text variant="small">{t("table.loading")}</Text>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center"
              >
                <Text
                  variant="small"
                  className="text-destructive"
                >
                  {t("table.error")}
                </Text>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center"
              >
                <Text variant="small">{emptyLabel ?? t("table.empty")}</Text>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={rowKey(row)}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={col.className}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
