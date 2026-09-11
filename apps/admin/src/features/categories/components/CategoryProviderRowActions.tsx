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
import { useDeleteCategoryProviders } from "../hooks/useCategoryProviders";
import type { CategoryProvider } from "../types/categoryProvider.type";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { CategoryProviderFormDialog } from "./CategoryProviderFormDialog";

interface CategoryProviderRowActionsProps {
  categoryProvider: CategoryProvider;
}

/** Row action menu (product_requirements.md §4.5, line 245) — two items only,
 * and correctly labelled in this reference for once. No deactivate/activate:
 * this entity has no status concept, same as Category Server. Delete reuses
 * the feature's shared confirmation and the same mutation as the toolbar's
 * bulk "Delete (N)", passing a single id. */
export function CategoryProviderRowActions({ categoryProvider }: CategoryProviderRowActionsProps) {
  const { t } = useTranslation("categories");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteCategoryProviders = useDeleteCategoryProviders();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${categoryProvider.provider_name}`}
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
              <Pencil />{t("editCategoryProvider")}</DropdownMenuItem>
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
        title={t("deleteProviderTitle")}
        description={t("deleteProviderDescription")}
        onConfirm={() => deleteCategoryProviders.mutate([categoryProvider.id])}
      />

      <CategoryProviderFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categoryProviderId={categoryProvider.id}
      />
    </>
  );
}
