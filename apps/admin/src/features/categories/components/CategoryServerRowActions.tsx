import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("categories");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteCategoryServer = useDeleteCategoryServer();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${categoryServer.name}`}
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
              <Pencil />{t("editCategoryServer")}</DropdownMenuItem>
          </Can>
          <Can permission="categories.delete">
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 />{t("delete")}</DropdownMenuItem>
          </Can>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteServerTitle")}
        description={t("deleteServerDescription")}
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
