import { useState } from "react";
import { Lock, MoreHorizontal, SlidersHorizontal, Trash2, Unlock } from "lucide-react";

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
import { useDeleteProviderProducts, useLockProviderPrice } from "../hooks/useProviderProducts";
import type { ProviderProduct } from "../types/product.type";
import { ProviderMarginDialog } from "./ProviderMarginDialog";

interface ProviderRowActionsProps {
  provider: ProviderProduct;
}

/**
 * Row menu for the managed Product Provider list. Lock Price and Edit Profit
 * Margin are always available; Delete only for non-System rows — a System
 * provider (the Internal System supplier) is protected, matching the API which
 * rejects its deletion with a 403.
 */
export function ProviderRowActions({ provider }: ProviderRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [marginOpen, setMarginOpen] = useState(false);
  const lockPrice = useLockProviderPrice();
  const deleteProviders = useDeleteProviderProducts();

  const nextLocked = !provider.is_price_locked;

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
            <DropdownMenuItem onSelect={() => setMarginOpen(true)}>
              <SlidersHorizontal />
              Edit Profit Margin
            </DropdownMenuItem>
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

      <ProviderMarginDialog provider={provider} open={marginOpen} onOpenChange={setMarginOpen} />

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
