import { useState, type ReactNode } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ContentRowActionsProps {
  id: string;
  /** Used for the trigger's accessible name and the confirm copy. */
  label: string;
  entityLabel: string;
  onDelete: (ids: string[]) => void;
  /** Opens the edit modal owned by the list page, for this row's id. */
  onEdit: (id: string) => void;
  extraItems?: ReactNode;
}

/**
 * Row menu shared by every content table.
 *
 * The content entities have identical row actions, so one component serves
 * them all rather than copies that would drift. Edit opens the edit modal
 * owned by the list page — the same rule the categories feature follows.
 */
export function ContentRowActions({ id, label, entityLabel, onDelete, onEdit, extraItems }: ContentRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${label}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="content.edit">
            <DropdownMenuItem onSelect={() => onEdit(id)}>
              <Pencil />
              Edit {entityLabel}
            </DropdownMenuItem>
          </Can>
          {extraItems}
          <Can permission="content.delete">
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
        title={`Delete this ${entityLabel.toLowerCase()}?`}
        description={`This action cannot be undone. "${label}" will be permanently removed from the storefront.`}
        onConfirm={() => onDelete([id])}
      />
    </>
  );
}
