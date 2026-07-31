import { useLocation } from "@tanstack/react-router";
import { ChevronDown, CloudUpload, ImageIcon, Plus, Power, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { Link } from "@/components/common/Link";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
}

/**
 * Toolbar for the Main Products list (product_requirements.md §4.6) — search,
 * a category filter, a price filter, refresh, and "+ Add Main Products",
 * matching the reference left to right, with the selection action bar
 * (Digiflazz / Logo / Deactive / Delete) on its own right-aligned row below.
 *
 * The add link derives its target from the current pathname rather than a
 * hardcoded absolute path, so the same component works under both the real
 * route and the unauthenticated preview twin.
 *
 * "Deactive" keeps the reference's label; the confirmation says "Deactivate".
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
  onBulkDeactivate,
  onBulkDelete,
}: MainProductToolbarProps) {
  const { pathname } = useLocation();
  const addHref = `${pathname.replace(/\/$/, "")}/add`;

  // ponytail: the reference shows these two, but nothing specifies what a bulk
  // Digiflazz push or a bulk logo upload does — the Product Provider tab and
  // the upload endpoint are both roadmap (§5). They say so rather than guess a
  // mutation; swap in the real handler when either lands.
  const announceDeferred = (message: string) => () => toast.info(message);

  return (
    <Box className="flex flex-col gap-3">
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
          {/* Two ways in, per the reference: one product at a time, or a bulk
              import. The reference's menu reads "Menual" — a misspelling, not
              a term, so it is corrected the same way the lorem-ipsum subcopy
              and the "9999999" footer were. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl">
                <Plus className="size-4" />
                Add Main Products
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl"
            >
              <DropdownMenuItem asChild>
                <Link href={addHref}>Manual</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={announceDeferred("Bulk product import lands with the Add Product form")}>
                Bulk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
      </Box>

      {/* Selection actions, in the reference's order. Only rendered with a
          selection, so the row is never a bar of dead buttons. */}
      {selectedCount > 0 && (
        <Box className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={announceDeferred("Pushing products to Digiflazz lands with the Product Provider tab")}
          >
            <CloudUpload className="size-4" />
            Digiflazz ({selectedCount})
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={announceDeferred("Bulk logo upload lands with the product image endpoint")}
          >
            <ImageIcon className="size-4" />
            Logo ({selectedCount})
          </Button>
          <Can permission="products.edit">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={onBulkDeactivate}
            >
              <Power className="size-4" />
              Deactive ({selectedCount})
            </Button>
          </Can>
          <Can permission="products.delete">
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
          </Can>
        </Box>
      )}
    </Box>
  );
}
