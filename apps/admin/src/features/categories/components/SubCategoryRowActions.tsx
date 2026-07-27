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
import { useDeleteSubCategories } from "../hooks/useSubCategories";
import type { SubCategory } from "../types/subCategory.type";
import { DeleteSubCategoryDialog } from "./DeleteSubCategoryDialog";

interface SubCategoryRowActionsProps {
  subCategory: SubCategory;
}

/** Row action menu (product_requirements.md §4.5, line 208) — "Edit Sub
 * Category" and "Delete", the only useful information in the reference frame
 * whose table still showed the shadcn demo dataset behind it. */
export function SubCategoryRowActions({ subCategory }: SubCategoryRowActionsProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteSubCategories = useDeleteSubCategories();

  // Derived from the current pathname, not hardcoded, so the unauthenticated
  // preview route can never navigate into the real, guarded one.
  const editHref = `${pathname.replace(/\/$/, "")}/${subCategory.id}/edit`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${subCategory.name}`}
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

      <DeleteSubCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        count={1}
        onConfirm={() => deleteSubCategories.mutate([subCategory.id])}
      />
    </>
  );
}
