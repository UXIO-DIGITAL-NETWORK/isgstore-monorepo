import { useNavigate } from "@tanstack/react-router";
import { Archive, ChevronDown, Eye, ImageIcon, Lock, Plus, RefreshCcw, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

import { Box } from "@/components/common/Box";
import { BulkActionsMenu } from "@/components/common/BulkActionsMenu";
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
import { PRICE_RANGE_OPTIONS } from "../data/select-options.data";
import { useProductSelectOptions } from "../hooks/useProductSelectOptions";
import { PUBLISH_STATE_LABELS, PUBLISH_STATES } from "../types/product.type";

const CLEAR_VALUE = "all";

interface MainProductToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category?: string;
  publishState?: string;
  onCategoryChange: (value: string | undefined) => void;
  price?: string;
  onPriceChange: (value: string | undefined) => void;
  onRefresh: () => void;
  onAdd: () => void;
  selectedCount: number;
  onBulkUxiolabs: () => void;
  onBulkShowPrice: () => void;
  onBulkLock: () => void;
  onPublishStateChange: (value?: string) => void;
  onBulkUnpublish: () => void;
  onBulkDelete: () => void;
}

/**
 * Toolbar for the Main Products list (product_requirements.md §4.6) — search,
 * a category filter, a status filter, a price filter, refresh, and "+ Add Main Products",
 * matching the reference left to right, with the selection action bar
 * (Uxiolabs / Logo / Unpublish / Archive) on its own right-aligned row below.
 *
 * The add link derives its target from the current pathname rather than a
 * hardcoded absolute path, so the same component works under both the real
 * route and the unauthenticated preview twin.
 *
 * The lifecycle entry is "Unpublish" — one verb for taking a product off sale,
 * matching the row menu. It was "Deactive", which only moved half of what makes
 * a product sellable.
 */
export function MainProductToolbar({
  search,
  onSearchChange,
  category,
  publishState,
  onCategoryChange,
  price,
  onPriceChange,
  onRefresh,
  onAdd,
  selectedCount,
  onBulkUxiolabs,
  onBulkShowPrice,
  onBulkLock,
  onPublishStateChange,
  onBulkUnpublish,
  onBulkDelete,
}: MainProductToolbarProps) {
  // The same source the product form, bulk-add and provider pool already read,
  // so every category select in this feature agrees on what exists.
  const { categoryOptions } = useProductSelectOptions();

  const navigate = useNavigate();
  // Edit Logo (bulk) still waits on the product image endpoint (§5); it says so
  // rather than guessing a mutation.
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
                {categoryOptions.map((option) => (
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
            <Label htmlFor="product-state-filter">Status</Label>
            {/* Archived products are excluded by default — the row is kept only
                so its order history keeps resolving, not to clutter the
                catalogue. This select is the one way back to them. */}
            <Select
              value={publishState ?? ""}
              onValueChange={(next) => onPublishStateChange(next === CLEAR_VALUE ? undefined : next)}
            >
              <SelectTrigger
                id="product-state-filter"
                className="w-44 rounded-xl"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CLEAR_VALUE}>All statuses</SelectItem>
                {PUBLISH_STATES.map((state) => (
                  <SelectItem
                    key={state}
                    value={state}
                  >
                    {PUBLISH_STATE_LABELS[state]}
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
              <DropdownMenuItem onSelect={onAdd}>Manual</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate({ to: "/admin/products/main/add-bulk" })}>
                Bulk
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Box>
      </Box>

      {/* Selection actions collapse into one "N items selected" menu (the
          reference's checklist menu), only shown with a selection. Edit Logo
          still waits on the product image endpoint (§5). */}
      {selectedCount > 0 && (
        <Box className="flex justify-end">
          <BulkActionsMenu
            count={selectedCount}
            actions={[
              {
                label: "Edit Logo",
                icon: <ImageIcon className="size-4" />,
                onSelect: announceDeferred("Bulk logo upload lands with the product image endpoint"),
              },
              { label: "Uxiolabs Update", icon: <RefreshCcw className="size-4" />, onSelect: onBulkUxiolabs },
              { label: "Show Price", icon: <Eye className="size-4" />, onSelect: onBulkShowPrice },
              { label: "Lock Price", icon: <Lock className="size-4" />, onSelect: onBulkLock },
              { label: "Unpublish", icon: <Archive className="size-4" />, onSelect: onBulkUnpublish },
              { label: "Archive", icon: <Archive className="size-4" />, destructive: true, onSelect: onBulkDelete },
            ]}
          />
        </Box>
      )}
    </Box>
  );
}
