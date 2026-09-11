import { useTranslation } from "react-i18next";
import { useState } from "react";
import { MoreVertical, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FeedbackRowActionsProps {
  id: string;
  /** Reviewer name — the trigger's accessible name and the confirm copy. */
  label: string;
  onDelete: (id: string) => void;
}

/**
 * Row menu for the Feedback table.
 *
 * Delete is the only action: a review belongs to the customer who wrote it, so
 * the admin can remove abuse but never rewrite what someone said. The whole
 * menu is behind `feedback.delete`, so a view-only admin sees no trigger at
 * all rather than a menu that turns out to be empty.
 */
export function FeedbackRowActions({ id, label, onDelete }: FeedbackRowActionsProps) {
  const { t } = useTranslation("feedback");
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Can permission="feedback.delete">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="rounded-xl"
            size="icon-sm"
            aria-label={`Actions for ${label}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />{t("delete")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("deleteTitle")}
        description={`This action cannot be undone. The review by ${label} will be permanently removed from the storefront.`}
        onConfirm={() => onDelete(id)}
      />
    </Can>
  );
}
