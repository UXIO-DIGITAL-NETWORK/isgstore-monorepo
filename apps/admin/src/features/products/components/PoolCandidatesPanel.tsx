import { useCallback, useMemo, useState } from "react";
import { Plus, RefreshCw, X } from "lucide-react";

import { Box } from "@/components/common/Box";
import { DataTable } from "@/components/common/DataTable";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { poolCandidateColumns } from "./poolCandidateColumns";
import { usePoolCandidates, usePoolSkus } from "../hooks/useProviderPool";
import type { PoolCandidate } from "../types/product.type";

const DEFAULT_PAGE_SIZE = 10;
const ALL = "all";

interface PoolCandidatesPanelProps {
  onClose: () => void;
}

/**
 * "Add Product Provider", in page.
 *
 * This used to be a route of its own that listed the provider's entire price
 * list. It is a panel now, and it only offers SKUs whose provider category has
 * a Category Provider mapping — so configuring a game is literally what makes
 * its catalogue appear here.
 *
 * Rendered inline rather than in a side sheet on purpose: it is a full table
 * with its own filters and pagination, which a sheet would crush.
 */
export function PoolCandidatesPanel({ onClose }: PoolCandidatesPanelProps) {
  const [search, setSearch] = useState("");
  const [poolState, setPoolState] = useState("new");
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

  const handleAdd = () => {
    poolSkus.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        onClose();
      },
    });
  };

  return (
    // A labelled region: the pool table behind it lists some of the same SKU
    // names, so the panel has to be addressable on its own — by a screen reader
    // as much as by a test.
    <Box
      as="section"
      aria-label="Add Product Provider"
      className="rounded-2xl border border-border bg-card p-6"
    >
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Heading
            level={2}
            variant="subtitle"
          >
            Add Product Provider
          </Heading>
          <Text variant="muted">
            Provider services for the games you have mapped under Category Provider. Pick the ones to pull into the
            pool — nothing is priced or sold yet.
          </Text>
        </Box>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close the add panel"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </Box>

      <Box className="mt-4 flex flex-wrap items-center gap-3">
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

        <Box className="ml-auto">
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
    </Box>
  );
}
