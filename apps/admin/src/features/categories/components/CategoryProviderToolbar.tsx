import { useLocation } from "@tanstack/react-router";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVIDER_OPTIONS } from "../data/select-options.data";

const CLEAR_VALUE = "all";

interface CategoryProviderToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  providerName?: string;
  onProviderChange: (value: string | undefined) => void;
  onRefresh: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

/**
 * Toolbar (product_requirements.md §4.5, lines 241-245) — search, a provider
 * filter, refresh, and "+ Add Category Provider".
 *
 * **The add button's label is a correction.** The reference reads
 * "+ Add Category Server", copy-pasted from the tab built immediately before
 * this one (§4.5 line 243) — the same class of leftover as "Category Type
 * Name" on that tab, landing in two places this round rather than one.
 *
 * A destructive "Delete (N)" appears once rows are checked: one reference
 * screenshot shows checkboxes selected but renders the bulk-action area
 * garbled, so this follows the pattern already established for Sub Category
 * rather than leaving checkboxes with no resulting action.
 *
 * The add link derives its target from the current pathname rather than a
 * hardcoded absolute path, so it stays inside the preview route.
 */
export function CategoryProviderToolbar({
  search,
  onSearchChange,
  providerName,
  onProviderChange,
  onRefresh,
  selectedCount,
  onBulkDelete,
}: CategoryProviderToolbarProps) {
  const { pathname } = useLocation();
  const addHref = `${pathname.replace(/\/$/, "")}/add`;

  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-provider-search">Search</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="category-provider-search"
              className="w-64 rounded-xl pl-8"
              placeholder="Search category provider"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-provider-filter">Provider</Label>
          {/* `""` (not the clear sentinel) when unfiltered, so Radix shows the
              placeholder rather than the "All providers" item's label. */}
          <Select
            value={providerName ?? ""}
            onValueChange={(next) => onProviderChange(next === CLEAR_VALUE ? undefined : next)}
          >
            <SelectTrigger
              id="category-provider-filter"
              className="w-56 rounded-xl"
            >
              <SelectValue placeholder="Type to search provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>All providers</SelectItem>
              {PROVIDER_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Box>
      </Box>

      <Box className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl"
          onClick={onRefresh}
        >
          <RefreshCw className="size-4" />
          <Text
            as="span"
            className="sr-only"
          >
            Refresh
          </Text>
        </Button>
        {selectedCount > 0 && (
          <Button
            variant="destructive"
            // `dark:bg-destructive` overrides the variant's own
            // `dark:bg-destructive/60`, which renders washed out next to the
            // row menu's full-strength red Delete.
            className="rounded-xl bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:hover:bg-destructive/90"
            onClick={onBulkDelete}
          >
            <Trash2 className="size-4" />
            Delete ({selectedCount})
          </Button>
        )}
        <Button
          asChild
          className="rounded-xl"
        >
          <Link href={addHref}>
            <Plus className="size-4" />
            Add Category Provider
          </Link>
        </Button>
      </Box>
    </Box>
  );
}
