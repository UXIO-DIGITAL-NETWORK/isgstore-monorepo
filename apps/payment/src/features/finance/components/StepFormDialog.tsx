import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ServiceInstallationStep } from "@/types/service.type";

import { useCreateStep, useUpdateStep } from "../hooks/useFinance";

interface StepFormDialogProps {
  subscriptionId: number;
  installationId: number | undefined;
  /** Absent = add. Present = edit that step. */
  step?: ServiceInstallationStep;
}

export function StepFormDialog({ subscriptionId, installationId, step }: StepFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(step?.title ?? "");
  const [description, setDescription] = useState(step?.description ?? "");
  const [error, setError] = useState<string>();

  const { mutate: create, isPending: creating } = useCreateStep(subscriptionId, installationId);
  const { mutate: update, isPending: updating } = useUpdateStep(subscriptionId);

  const isEdit = Boolean(step);
  const isPending = creating || updating;

  const reset = () => {
    setTitle(step?.title ?? "");
    setDescription(step?.description ?? "");
    setError(undefined);
  };

  const submit = () => {
    if (!title.trim()) {
      setError("Judul tahapan wajib diisi.");
      return;
    }

    const payload = { title: title.trim(), description: description.trim() || null };
    const done = {
      onSuccess: () => {
        setError(undefined);
        setOpen(false);
      },
    };

    if (step) {
      update({ id: step.id, payload }, done);
    } else {
      create(payload, done);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          size={isEdit ? "sm" : "default"}
          variant={isEdit ? "outline" : "default"}
          // Steps hang off the installation, so there is nothing to add to
          // until it exists.
          disabled={!installationId}
        >
          {isEdit ? "Edit" : "Tambah Tahapan"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tahapan" : "Tambah Tahapan"}</DialogTitle>
          <DialogDescription>Tahapan baru masuk ke urutan terakhir.</DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="step-title">Judul</Label>
            <Input
              id="step-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Pembuatan API key"
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="step-description">Keterangan</Label>
            <Input
              id="step-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Box>

          {error && <Box className="text-sm text-destructive">{error}</Box>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={submit}
            >
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
