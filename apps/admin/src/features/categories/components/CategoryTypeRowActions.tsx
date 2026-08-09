import { useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteCategoryType, useSetCategoryTypeStatus } from "../hooks/useCategoryTypes";
import type { CategoryType } from "../types/categoryType.type";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { CategoryTypeFormDialog } from "./CategoryTypeFormDialog";
import { StatusConfirmDialog } from "./StatusConfirmDialog";

interface CategoryTypeRowActionsProps {
  categoryType: CategoryType;
}

/**
 * Row action menu (product_requirements.md §4.5) — three items, in the
 * reference's order, behind two deliberately different confirmations.
 *
 * The reference only ever shows an active row, so it always reads "Deactive".
 * Labelling an already-inactive row "Deactive" would be a dead action, so the
 * label and the target status are both derived from the row.
 */
export function CategoryTypeRowActions({ categoryType }: CategoryTypeRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteCategoryType = useDeleteCategoryType();
  const setCategoryTypeStatus = useSetCategoryTypeStatus();

  const isActive = categoryType.status === "active";
  const action = isActive ? "deactivate" : "activate";
  const nextStatus = isActive ? "inactive" : "active";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${categoryType.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="categories.edit">
            {/* "Deactive" matches the reference's label verbatim; its reverse
                is the grammatical "Activate". */}
            <DropdownMenuItem onSelect={() => setStatusOpen(true)}>
              <Power />
              {isActive ? "Deactive" : "Activate"}
            </DropdownMenuItem>
          </Can>
          <Can permission="categories.edit">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              Edit Category Type
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

      <StatusConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        action={action}
        onConfirm={() => setCategoryTypeStatus.mutate({ id: categoryType.id, status: nextStatus })}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this category type?"
        description="This action cannot be undone. This will permanently delete this category type."
        onConfirm={() => deleteCategoryType.mutate(categoryType.id)}
      />

      <CategoryTypeFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categoryTypeId={categoryType.id}
      />
    </>
  );
}
