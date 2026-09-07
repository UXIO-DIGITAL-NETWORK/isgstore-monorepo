import { Plus, RefreshCw, Search } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategoryTypeOptions } from "../hooks/useCategoryTypeOptions";

const CLEAR_VALUE = "all";

interface CategoryToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  type?: string;
  onTypeChange: (value: string | undefined) => void;
  onRefresh: () => void;
  onAdd: () => void;
}

/**
 * Toolbar (product_requirements.md §4.5) — search, a "Type Category" filter,
 * a refresh icon button, and "+ Add Category". The add button opens the
 * Add Category modal owned by the list page.
 */
export function CategoryToolbar({ search, onSearchChange, type, onTypeChange, onRefresh, onAdd }: CategoryToolbarProps) {
  // The API filters on `type_id`, so the options have to be the real rows —
  // a hardcoded list of names could never match, and a type created on the
  // Category Type tab would never show up here.
  const { options } = useCategoryTypeOptions();

  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-search">Search</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="category-search"
              className="w-64 rounded-xl pl-8"
              placeholder="Search categories"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="category-type-filter">Type Category</Label>
          <Select
            value={type ?? CLEAR_VALUE}
            onValueChange={(next) => onTypeChange(next === CLEAR_VALUE ? undefined : next)}
          >
            <SelectTrigger
              id="category-type-filter"
              className="w-44 rounded-xl"
            >
              <SelectValue placeholder="Type Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>All types</SelectItem>
              {options.map((option) => (
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
        <Button
          className="rounded-xl"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Add Category
        </Button>
      </Box>
    </Box>
  );
}
