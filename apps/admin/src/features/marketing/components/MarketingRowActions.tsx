import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
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

interface MarketingRowActionsProps {
  id: string;
  /** Used for the trigger's accessible name and the confirm copy. */
  label: string;
  entityLabel: string;
  onDelete: (ids: string[]) => void;
  extraItems?: ReactNode;
}

/**
 * Row menu shared by every content table.
 *
 * The five content entities have identical row actions, so one component
 * serves them all rather than five copies that would drift. The edit target is
 * derived from the current pathname so a preview route can never navigate into
 * the guarded one — the same rule the categories feature follows.
 */
export function MarketingRowActions({ id, label, entityLabel, onDelete, extraItems }: MarketingRowActionsProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const editHref = `${pathname.replace(/\/$/, "")}/${id}/edit`;

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
          <Can permission="marketing.edit">
            <DropdownMenuItem onSelect={() => navigate({ to: editHref as unknown as string })}>
              <Pencil />
              Edit {entityLabel}
            </DropdownMenuItem>
          </Can>
          {extraItems}
          <Can permission="marketing.delete">
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
