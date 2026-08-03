import { useLocation } from "@tanstack/react-router";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/components/common/Link";

interface ContentToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
  searchPlaceholder: string;
  addLabel: string;
  /** Extra filter controls (locale, type) rendered between search and actions. */
  filters?: ReactNode;
  idPrefix: string;
}

/**
 * Toolbar shared by the content tables — search, optional filters, refresh,
 * add, and a destructive "Delete (N)" once rows are checked.
 *
 * The add link is built from the current pathname rather than hardcoded, so it
 * stays inside whichever route base the table is rendered under.
 */
export function ContentToolbar({
  search,
  onSearchChange,
  onRefresh,
  selectedCount,
  onBulkDelete,
  searchPlaceholder,
  addLabel,
  filters,
  idPrefix,
}: ContentToolbarProps) {
  const { pathname } = useLocation();
  const addHref = `${pathname.replace(/\/$/, "")}/add`;

  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-search`}>Search</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`${idPrefix}-search`}
              className="w-64 rounded-xl pl-8"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
        </Box>
        {filters}
      </Box>

      <Box className="flex items-end gap-2">
        {selectedCount > 0 && (
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            onClick={onBulkDelete}
          >
            <Trash2 className="size-4" />
            Delete ({selectedCount})
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl"
          aria-label="Refresh"
          onClick={onRefresh}
        >
          <RefreshCw className="size-4" />
        </Button>
        <Button
          asChild
          className="rounded-xl"
        >
          <Link href={addHref}>
            <Plus className="size-4" />
            {addLabel}
          </Link>
        </Button>
      </Box>
    </Box>
  );
}
