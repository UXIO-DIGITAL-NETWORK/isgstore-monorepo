import { useState } from "react";
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
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { CategoryServerFormDialog } from "./CategoryServerFormDialog";

interface CategoryServerRowActionsProps {
  categoryServer: CategoryServer;
}

/** Row action menu (product_requirements.md §4.5, line 233) — two items
 * only. No deactivate/activate: this entity has no status concept, unlike
 * Category Type. Delete reuses the feature's shared confirmation. */
export function CategoryServerRowActions({ categoryServer }: CategoryServerRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteCategoryServer = useDeleteCategoryServer();

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
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
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

      <CategoryServerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categoryServerId={categoryServer.id}
      />
    </>
  );
}
