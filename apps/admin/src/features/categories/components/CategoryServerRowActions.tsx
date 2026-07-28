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
import { useDeleteCategoryServer } from "../hooks/useCategoryServers";
import type { CategoryServer } from "../types/categoryServer.type";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface CategoryServerRowActionsProps {
  categoryServer: CategoryServer;
}

/** Row action menu (product_requirements.md §4.5, line 233) — two items
 * only. No deactivate/activate: this entity has no status concept, unlike
 * Category Type. Delete reuses the feature's shared confirmation. */
export function CategoryServerRowActions({ categoryServer }: CategoryServerRowActionsProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteCategoryServer = useDeleteCategoryServer();

  // Derived from the current pathname, not hardcoded, so the unauthenticated
  // preview route can never navigate into the real, guarded one.
  const editHref = `${pathname.replace(/\/$/, "")}/${categoryServer.id}/edit`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${categoryServer.name}`}
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
              Edit Category Server
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
        title="Delete this category server?"
        description="This action cannot be undone. This will permanently delete this category server and its options."
        onConfirm={() => deleteCategoryServer.mutate(categoryServer.id)}
      />
    </>
  );
}
