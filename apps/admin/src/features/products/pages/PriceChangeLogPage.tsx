import { useTranslation } from "react-i18next";
import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { priceChangeLogColumnsFor } from "../components/priceChangeLogColumns";
import { usePriceChangeLogList } from "../hooks/usePriceChangeLog";
import { PRICE_CHANGE_STATUSES, PRICE_CHANGE_STATUS_LABELS } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 20;
const ALL = "all";

/**
 * "Price Change Log" — the read-only record of what the 5-minute checker did.
 *
 * The checker auto-reprices live products from the margin rules, so this is the
 * admin's window into every change: routine reprices (`applied`) and the rows that
 * need handling — a SKU switched off at the provider (`deactivated`) or a margin
 * gone negative (`negative_margin`).
 */
export default function PriceChangeLogPage() {
  const { t } = useTranslation("products");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const params = useMemo(
    () => ({
      search: search || undefined,
      status,
      page,
      per_page: pageSize,
    }),
    [search, status, page, pageSize],
  );

  const { data, isLoading, isError, refetch } = usePriceChangeLogList(params);

  const resetToFirstPage = () => setPage(1);

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >{t("tabPriceChangeLog")}</Heading>
        <Text variant="muted">{t("priceChangeLogSubtitle")}</Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
            placeholder={t("searchProductOrSku")}
            aria-label={t("searchPriceChanges")}
            className="h-9 w-full rounded-xl sm:w-64"
          />

          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger
              aria-label={t("filterByStatus")}
              className="h-9 w-48 rounded-xl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("allChanges")}</SelectItem>
              {PRICE_CHANGE_STATUSES.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                >
                  {PRICE_CHANGE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("refreshPriceChanges")}
            className="rounded-xl"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        </Box>

        <Box className="mt-4">
          <DataTable
            columns={priceChangeLogColumnsFor(t)}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel={t("priceChangesEntity")}
            emptyMessage={t("priceChangesEmpty")}
            showRowNumber
            page={page}
            pageSize={pageSize}
            total={data?.meta.total ?? 0}
            lastPage={data?.meta.last_page ?? 1}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              resetToFirstPage();
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
