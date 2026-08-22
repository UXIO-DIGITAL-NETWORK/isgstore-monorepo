import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, Lock, MoreHorizontal, Pencil, Power, RefreshCcw, SlidersHorizontal, Trash2 } from "lucide-react";

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
import {
  useDeactivateProducts,
  useDeleteProducts,
  useUxiotopupUpdateProducts,
  useLockProducts,
  useShowProducts,
} from "../hooks/useProducts";
import type { Product } from "../types/product.type";
import { MainProductFormDialog } from "./MainProductFormDialog";

interface ProductRowActionsProps {
  product: Product;
}

/**
 * Row menu for the Main Products list, in the reference's order. Each action is
 * wired: Uxiotopup Update / Show Price / Lock Price go through a confirm dialog,
 * Set Price Limit opens its page, and Deactive / Edit / Delete are unchanged.
 * The single-row paths reuse the bulk hooks with a one-id selection.
 */
export function ProductRowActions({ product }: ProductRowActionsProps) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [uxiotopupOpen, setUxiotopupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteProducts = useDeleteProducts();
  const deactivateProducts = useDeactivateProducts();
  const lockProducts = useLockProducts();
  const showProducts = useShowProducts();
  const uxiotopupUpdate = useUxiotopupUpdateProducts();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${product.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="products.edit">
            <DropdownMenuItem onSelect={() => setUxiotopupOpen(true)}>
              <RefreshCcw />
              Uxiotopup Update
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowOpen(true)}>
              <Eye />
              Show Price
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLockOpen(true)}>
              <Lock />
              Lock Price
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                navigate({ to: "/admin/products/main/set-price-limit", search: { id: product.id } })
              }
            >
              <SlidersHorizontal />
              Set Price Limit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDeactivateOpen(true)}>
              <Power />
              Deactive
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              Edit Product
            </DropdownMenuItem>
          </Can>
          <Can permission="products.delete">
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={uxiotopupOpen}
        onOpenChange={setUxiotopupOpen}
        icon={<RefreshCcw />}
        confirmLabel="Update"
        title="Update this product?"
        description="Re-pull this product's selling prices from its supplier cost. A locked price is left unchanged."
        onConfirm={() => uxiotopupUpdate.mutate([product.id])}
      />

      <DeleteConfirmDialog
        open={showOpen}
        onOpenChange={setShowOpen}
        icon={<Eye />}
        confirmLabel="Show"
        title="Show price for this product?"
        description="The price will be visible on the storefront."
        onConfirm={() => showProducts.mutate({ ids: [product.id], hidden: false })}
      />

      <DeleteConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        icon={<Lock />}
        confirmLabel="Lock"
        title="Lock this price?"
        description="The supplier sync will stop overwriting this product's price until it is unlocked."
        onConfirm={() => lockProducts.mutate({ ids: [product.id], locked: true })}
      />

      {/* Same shared dialog and same mutation as the toolbar's bulk delete —
          only the set of ids differs. The reference ships shadcn's own
          "permanently delete your account" example copy yet again; real
          wording is passed in rather than restyling the boilerplate. */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this product?"
        description="This action cannot be undone. This will permanently delete this product and remove all of its variants from the storefront."
        onConfirm={() => deleteProducts.mutate([product.id])}
      />

      <DeleteConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        icon={<Power />}
        confirmLabel="Deactivate"
        title="Deactivate this product?"
        description="This product will be marked inactive and hidden from the storefront. You can activate it again at any time."
        onConfirm={() => deactivateProducts.mutate([product.id])}
      />

      <MainProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        productId={product.id}
      />
    </>
  );
}
