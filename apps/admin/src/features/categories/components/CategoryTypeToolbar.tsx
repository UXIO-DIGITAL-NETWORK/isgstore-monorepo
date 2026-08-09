import { Plus, RefreshCw, Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryTypeToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
}

/**
 * Toolbar (product_requirements.md §4.5) — search, refresh, and
 * "+ Add Category Type". No parent-category filter: unlike Sub Category, a
 * category type has no parent to filter by. No bulk-delete button either —
 * this tab has no row selection.
 *
 * The add button opens the Add Category Type modal owned by the list page.
 */
export function CategoryTypeToolbar({ search, onSearchChange, onRefresh, onAdd }: CategoryTypeToolbarProps) {
  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-col gap-1.5">
        <Label htmlFor="category-type-search">Search</Label>
        <Box className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="category-type-search"
            className="w-64 rounded-xl pl-8"
            placeholder="Search category type"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
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
        <Button
          className="rounded-xl"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Add Category Type
        </Button>
      </Box>
    </Box>
  );
}
