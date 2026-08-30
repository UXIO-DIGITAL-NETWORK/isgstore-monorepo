import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteSubCategories } from "../hooks/useSubCategories";
import type { SubCategory } from "../types/subCategory.type";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { SubCategoryFormDialog } from "./SubCategoryFormDialog";

interface SubCategoryRowActionsProps {
  subCategory: SubCategory;
}

/** Row action menu (product_requirements.md §4.5, line 208) — "Edit Sub
 * Category" and "Delete", the only useful information in the reference frame
 * whose table still showed the shadcn demo dataset behind it. */
export function SubCategoryRowActions({ subCategory }: SubCategoryRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteSubCategories = useDeleteSubCategories();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${subCategory.name}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="categories.edit">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              Edit Sub Category
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
        title="Delete this sub category?"
        description="This action cannot be undone. This will permanently delete this sub category and remove it from the storefront."
        onConfirm={() => deleteSubCategories.mutate([subCategory.id])}
      />

      <SubCategoryFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        subCategoryId={subCategory.id}
      />
    </>
  );
}
