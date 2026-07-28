import { useLocation } from "@tanstack/react-router";
import { Plus, RefreshCw, Search, Trash2 } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_OPTIONS, PRICE_RANGE_OPTIONS } from "../data/select-options.data";

const CLEAR_VALUE = "all";

interface MainProductToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category?: string;
  onCategoryChange: (value: string | undefined) => void;
  price?: string;
  onPriceChange: (value: string | undefined) => void;
  onRefresh: () => void;
  selectedCount: number;
  onBulkDelete: () => void;
}

/**
 * Toolbar for the Main Products list (product_requirements.md §4.6) — search,
 * a category filter, a price filter, refresh, and "+ Add Main Products",
 * matching the reference left to right.
 *
 * The add link derives its target from the current pathname rather than a
 * hardcoded absolute path, so the same component works under both the real
 * route and the unauthenticated preview twin.
 */
export function MainProductToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  price,
  onPriceChange,
  onRefresh,
  selectedCount,
  onBulkDelete,
}: MainProductToolbarProps) {
  const { pathname } = useLocation();
  const addHref = `${pathname.replace(/\/$/, "")}/add`;

  return (
    <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <Box className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="product-search">Search</Label>
          <Box className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="product-search"
              className="w-64 rounded-xl pl-8"
              placeholder="Search product name"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="product-category-filter">Category</Label>
          {/* `""` (not the clear sentinel) when unfiltered, so Radix renders
              the placeholder rather than the "All categories" item's label. */}
          <Select
            value={category ?? ""}
            onValueChange={(next) => onCategoryChange(next === CLEAR_VALUE ? undefined : next)}
          >
            <SelectTrigger
              id="product-category-filter"
              className="w-56 rounded-xl"
            >
              <SelectValue placeholder="Type to search category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>All categories</SelectItem>
              {CATEGORY_OPTIONS.map((option) => (
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

        <Box className="flex flex-col gap-1.5">
          <Label htmlFor="product-price-filter">Price</Label>
          {/* Ranges are inferred: the reference only ever shows this select's
              "All Price" trigger, never its open list (§4.6). */}
          <Select
            value={price ?? ""}
            onValueChange={(next) => onPriceChange(next === CLEAR_VALUE ? undefined : next)}
          >
            <SelectTrigger
              id="product-price-filter"
              className="w-48 rounded-xl"
            >
              <SelectValue placeholder="All Price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CLEAR_VALUE}>All Price</SelectItem>
              {PRICE_RANGE_OPTIONS.map((option) => (
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
            Add Main Products
          </Link>
        </Button>
      </Box>
    </Box>
  );
}
