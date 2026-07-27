import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteCategory } from "../hooks/useCategories";
import type { Category } from "../types/category.type";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

interface CategoryRowActionsProps {
  category: Category;
}

/**
 * Row action menu (product_requirements.md §4.5) — only "Delete" was
 * visually confirmed in the reference; "Edit" is added since there is no
 * other way to reach the edit form.
 */
export function CategoryRowActions({ category }: CategoryRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteCategory = useDeleteCategory();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${category.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="categories.edit">
            <DropdownMenuItem onSelect={() => toast(`Edit ${category.name} — coming soon`)}>
              <Pencil />
              Edit
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

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        categoryName={category.name}
        onConfirm={() => deleteCategory.mutate(category.id)}
      />
    </>
  );
}
