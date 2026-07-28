import { useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteCategoryProviders } from "../hooks/useCategoryProviders";
import type { CategoryProvider } from "../types/categoryProvider.type";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

interface CategoryProviderRowActionsProps {
  categoryProvider: CategoryProvider;
}

/** Row action menu (product_requirements.md §4.5, line 245) — two items only,
 * and correctly labelled in this reference for once. No deactivate/activate:
 * this entity has no status concept, same as Category Server. Delete reuses
 * the feature's shared confirmation and the same mutation as the toolbar's
 * bulk "Delete (N)", passing a single id. */
export function CategoryProviderRowActions({ categoryProvider }: CategoryProviderRowActionsProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteCategoryProviders = useDeleteCategoryProviders();

  // Derived from the current pathname, not hardcoded, so the unauthenticated
  // preview route can never navigate into the real, guarded one.
  const editHref = `${pathname.replace(/\/$/, "")}/${categoryProvider.id}/edit`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${categoryProvider.provider_name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="categories.edit">
            <DropdownMenuItem onSelect={() => navigate({ to: editHref as unknown as string })}>
              <Pencil />
              Edit Category Provider
            </DropdownMenuItem>
          </Can>
          <Can permission="categories.delete">
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
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this category provider?"
        description="This action cannot be undone. This will permanently delete this category provider and unlink the supplier from this category."
        onConfirm={() => deleteCategoryProviders.mutate([categoryProvider.id])}
      />
    </>
  );
}
