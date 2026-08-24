import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Lock,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  RefreshCcw,
  SlidersHorizontal,
  Trash2,
  Unlock,
} from "lucide-react";

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
  useDeleteProducts,
  useUxiotopupUpdateProducts,
  useLockProducts,
  useSetProductStatus,
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
 * Set Price Limit opens its page, and the lifecycle toggle / Edit / Delete are
 * unchanged.
 * The single-row paths reuse the bulk hooks with a one-id selection.
 *
 * The three reversible items — lifecycle, price lock, price visibility — each
 * read the row's own state and offer the direction that would change something.
 * An inactive row is offered "Activate", never a "Deactive" that would be a
 * no-op against the Inactive badge one column to its left; a locked row is
 * offered "Unlock Price", matching how the Provider list's menu already works.
 */
export function ProductRowActions({ product }: ProductRowActionsProps) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  const [showOpen, setShowOpen] = useState(false);
  const [uxiotopupOpen, setUxiotopupOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteProducts = useDeleteProducts();
  const setProductStatus = useSetProductStatus();
  const lockProducts = useLockProducts();
  const showProducts = useShowProducts();
  const uxiotopupUpdate = useUxiotopupUpdateProducts();

  // Each toggle names what the click would do, not what the row currently is.
  const nextActive = product.status !== "active";
  const nextLocked = !product.is_price_locked;
  const nextHidden = !product.is_price_hidden;

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
              {nextHidden ? <EyeOff /> : <Eye />}
              {nextHidden ? "Hide Price" : "Show Price"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setLockOpen(true)}>
              {nextLocked ? <Lock /> : <Unlock />}
              {nextLocked ? "Lock Price" : "Unlock Price"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() =>
                navigate({ to: "/admin/products/main/set-price-limit", search: { id: product.id } })
              }
            >
              <SlidersHorizontal />
              Set Price Limit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setStatusOpen(true)}>
              {nextActive ? <Power /> : <PowerOff />}
              {nextActive ? "Activate" : "Deactive"}
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
        icon={nextHidden ? <EyeOff /> : <Eye />}
        confirmLabel={nextHidden ? "Hide" : "Show"}
        title={nextHidden ? "Hide price for this product?" : "Show price for this product?"}
        description={
          nextHidden
            ? "The price will be hidden on the storefront. The product itself stays listed."
            : "The price will be visible on the storefront."
        }
        onConfirm={() => showProducts.mutate({ ids: [product.id], hidden: nextHidden })}
      />

      <DeleteConfirmDialog
        open={lockOpen}
        onOpenChange={setLockOpen}
        icon={nextLocked ? <Lock /> : <Unlock />}
        confirmLabel={nextLocked ? "Lock" : "Unlock"}
        title={nextLocked ? "Lock this price?" : "Unlock this price?"}
        description={
          nextLocked
            ? "The supplier sync will stop overwriting this product's price until it is unlocked."
            : "The supplier sync will resume overwriting this product's price from its cost."
        }
        onConfirm={() => lockProducts.mutate({ ids: [product.id], locked: nextLocked })}
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
        open={statusOpen}
        onOpenChange={setStatusOpen}
        icon={nextActive ? <Power /> : <PowerOff />}
        confirmLabel={nextActive ? "Activate" : "Deactivate"}
        title={nextActive ? "Activate this product?" : "Deactivate this product?"}
        description={
          nextActive
            ? "This product will be marked active and sellable on the storefront again. Its price visibility is left as it was."
            : "This product will be marked inactive and hidden from the storefront. You can activate it again at any time."
        }
        onConfirm={() => setProductStatus.mutate({ ids: [product.id], active: nextActive })}
      />

      <MainProductFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        productId={product.id}
      />
    </>
  );
}
