import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, RefreshCw } from "lucide-react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { poolCandidateColumns } from "../components/poolCandidateColumns";
import { usePoolCandidates, usePoolSkus } from "../hooks/useProviderPool";
import type { PoolCandidate } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "all";
const POOL_PATH = "/admin/products/provider";

/**
 * "Add Product Provider" — a page of its own.
 *
 * It briefly lived as a panel inside the pool page, which put two tables on one
 * screen showing overlapping SKU names. That was ambiguous enough that the tests
 * needed an `aria-label` to tell the two apart; a person had no such affordance.
 *
 * It offers only SKUs whose provider category has a Category Provider mapping, so
 * configuring a game is literally what makes its catalogue appear here.
 */
export default function PoolCandidatesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  // "All", not "New only".
  //
  // `is_new` means the provider published it recently, and the price checker
  // backdates the whole catalogue on its first run so that badge means something.
  // The side effect is that on any established install nothing is "new" — so a
  // "New only" default opened this page onto an empty table and hid the very
  // catalogue it exists to offer.
  const [poolState, setPoolState] = useState(ALL);
  const [availability, setAvailability] = useState("available");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const poolSkus = usePoolSkus();

  const params = useMemo(
    () => ({
      search: search || undefined,
      pool_state: poolState,
      availability,
      page,
      per_page: pageSize,
    }),
    [search, poolState, availability, page, pageSize],
  );

  const { data, isLoading, isError, refetch } = usePoolCandidates(params);

  const handleSelectionChange = useCallback((ids: string[]) => setSelectedIds(ids), []);
  // An already-pooled SKU cannot be added again — DataTable renders a lock in
  // place of its checkbox and keeps it out of the selection entirely.
  const canSelectRow = useCallback((row: PoolCandidate) => !row.already_pooled, []);

  const resetToFirstPage = () => setPage(1);
  const backToPool = () => navigate({ to: POOL_PATH });

  const handleAdd = () => {
    // `usePoolSkus` already invalidates the pool list and the summary badge, so
    // going straight back shows the new rows rather than a stale table.
    poolSkus.mutate(selectedIds, { onSuccess: backToPool });
  };

  return (
    <Box className="flex flex-col gap-6">
      <Box className="rounded-2xl border border-border bg-card p-6">
        <Heading
          level={1}
          variant="section"
        >
          Add Product Provider
        </Heading>
        <Text variant="muted">
          Provider services for the games you have mapped under Category Provider. Pick the ones to pull into the
          pool — nothing is priced or sold yet.
        </Text>
      </Box>

      <Box className="rounded-2xl border border-border bg-card p-4">
        <Box className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Search service or SKU"
            aria-label="Search provider services"
            className="h-9 w-full rounded-xl sm:w-64"
          />

          <Select
            value={poolState}
            onValueChange={(value) => {
              setPoolState(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger
              aria-label="Filter by pool state"
              className="h-9 w-44 rounded-xl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New only</SelectItem>
              <SelectItem value="not_pooled">Not pooled</SelectItem>
              <SelectItem value={ALL}>All</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={availability}
            onValueChange={(value) => {
              setAvailability(value);
              resetToFirstPage();
            }}
          >
            <SelectTrigger
              aria-label="Filter by availability"
              className="h-9 w-44 rounded-xl"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available only</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
              <SelectItem value={ALL}>All</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Refresh candidates"
            className="rounded-xl"
            onClick={() => refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        </Box>

        <Box className="mt-4">
          <DataTable
            columns={poolCandidateColumns}
            data={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            entityLabel="provider services"
            emptyMessage="No provider services match. Map the game under Category Provider first, or widen the filters."
            canSelectRow={canSelectRow}
            onSelectionChange={handleSelectionChange}
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

        <Box className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={backToPool}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            disabled={selectedIds.length === 0 || poolSkus.isPending}
            onClick={handleAdd}
          >
            <Plus className="size-4" />
            {poolSkus.isPending
              ? "Adding..."
              : selectedIds.length > 0
                ? `Add ${selectedIds.length} to pool`
                : "Add to pool"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
