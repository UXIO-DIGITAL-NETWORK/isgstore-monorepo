import { useState } from "react";
import { ArrowUpCircle, Lock, MoreHorizontal, Rocket, SlidersHorizontal, Trash2, Unlock } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Can } from "@/components/common/Can";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

import { Text } from "@/components/common/Text";
import { useDeleteProviderProducts, useLockProviderPrice } from "../hooks/useProviderProducts";
import { usePromoteAndPublishProviderProducts, usePromoteProviderProducts } from "../hooks/useProviderPool";
import type { ProviderProduct } from "../types/product.type";

interface ProviderRowActionsProps {
  provider: ProviderProduct;
}

/**
 * Row menu for the Product Provider pool. Lock Price and Edit Profit Margin are
 * always available; Delete only for non-System rows — a System provider (the
 * Internal System supplier) is protected, matching the API's 403.
 *
 * Promote carries its blocking reason inside the disabled item rather than in a
 * tooltip: a disabled `DropdownMenuItem` swallows pointer events, so a tooltip on
 * it would never fire. The reason comes from the API, so the menu and the 422 can
 * never tell the admin different things.
 *
 * There is no Publish here any more. A promoted SKU leaves the pool — it is a
 * Main Product now, and that is where it is published, unpublished and archived.
 * Publishing from both screens is what made "where does this product live?"
 * unanswerable. What remains is the shortcut: Promote & Publish, so onboarding a
 * priced category does not need a trip through the other list.
 */
export function ProviderRowActions({ provider }: ProviderRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const lockPrice = useLockProviderPrice();
  const deleteProviders = useDeleteProviderProducts();
  const promote = usePromoteProviderProducts();
  const promoteAndPublish = usePromoteAndPublishProviderProducts();
  const navigate = useNavigate();

  const nextLocked = !provider.is_price_locked;
  const isPooled = provider.pool_state === "needs_margin" || provider.pool_state === "ready";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${provider.product_name}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl">
          <Can permission="products.edit">
            <DropdownMenuItem onSelect={() => setLockOpen(true)}>
              {provider.is_price_locked ? <Unlock /> : <Lock />}
              {provider.is_price_locked ? "Unlock Price" : "Lock Price"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                navigate({
                  to: "/admin/products/provider/set-profit-margin",
                  search: { ids: provider.id },
                })
              }
            >
              <SlidersHorizontal />
              Set Profit Margin
            </DropdownMenuItem>
            {isPooled && (
              <DropdownMenuItem
                disabled={!provider.can_promote}
                onSelect={() => promote.mutate([provider.id])}
              >
                <ArrowUpCircle />
                <Box className="flex flex-col items-start">
                  Promote to Main Product
                  {!provider.can_promote && provider.promote_blocked_reason && (
                    <Text as="span" variant="small" className="text-muted-foreground">
                      {provider.promote_blocked_reason}
                    </Text>
                  )}
                </Box>
              </DropdownMenuItem>
            )}
            {isPooled && (
              <DropdownMenuItem
                disabled={!provider.can_promote}
                onSelect={() => promoteAndPublish.mutate([provider.id])}
              >
                <Rocket />
                Promote &amp; Publish
              </DropdownMenuItem>
            )}
          </Can>
          {!provider.is_system && (
            <Can permission="products.delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </Can>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        icon={nextLocked ? <Lock /> : <Unlock />}
        confirmLabel={nextLocked ? "Lock" : "Unlock"}
        title={nextLocked ? "Lock this price?" : "Unlock this price?"}
        description={
          nextLocked
            ? "The daily supplier sync will stop overwriting this product's price until you unlock it."
            : "The daily supplier sync will resume updating this product's price from the supplier."
        }
        onConfirm={() => lockPrice.mutate({ id: provider.id, locked: nextLocked })}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this provider product?"
        description="This action cannot be undone. It permanently removes this provider mapping."
        onConfirm={() => deleteProviders.mutate([provider.id])}
      />
    </>
  );
}
