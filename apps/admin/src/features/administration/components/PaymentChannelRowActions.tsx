import { useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";

import { Can } from "@/components/common/Can";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePaymentChannels, useUpdatePaymentChannel } from "../hooks/useAdministration";
import type { PaymentChannel } from "../types/administration.type";
import { EditPaymentChannelDialog } from "./EditPaymentChannelDialog";

export function PaymentChannelRowActions({ channel }: { channel: PaymentChannel }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const updateChannel = useUpdatePaymentChannel();
  const deleteChannels = useDeletePaymentChannels();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${channel.name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-2xl"
        >
          <Can permission="payments.edit">
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => updateChannel.mutate({ id: channel.id, input: { is_active: !channel.is_active } })}
            >
              <Power />
              {channel.is_active ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
          </Can>
          <Can permission="payments.delete">
            <DropdownMenuSeparator />
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

      <EditPaymentChannelDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        channel={channel}
        isPending={updateChannel.isPending}
        onSubmit={(values) => updateChannel.mutate({ id: channel.id, input: values })}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${channel.name}?`}
        description="A channel with processed transactions cannot be deleted — deactivate it instead."
        onConfirm={() => deleteChannels.mutate([channel.id])}
      />
    </>
  );
}
