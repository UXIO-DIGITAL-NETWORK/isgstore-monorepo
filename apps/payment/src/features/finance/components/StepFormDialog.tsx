import { useTranslation } from "react-i18next";
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
  installationId: number | undefined;
  /** Absent = add. Present = edit that step. */
  step?: ServiceInstallationStep;
}

export function StepFormDialog({ installationId, step }: StepFormDialogProps) {
  const { t } = useTranslation("finance");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(step?.title ?? "");
  const [description, setDescription] = useState(step?.description ?? "");
  const [error, setError] = useState<string>();

  const { mutate: create, isPending: creating } = useCreateStep(installationId);
  const { mutate: update, isPending: updating } = useUpdateStep();

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
          {isEdit ? t("stepForm.triggerEdit") : t("stepForm.triggerCreate")}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("stepForm.titleEdit") : t("stepForm.titleCreate")}</DialogTitle>
          <DialogDescription>{t("stepForm.description")}</DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="step-title">{t("stepForm.title")}</Label>
            <Input
              id="step-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("stepForm.titlePlaceholder")}
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="step-description">{t("stepForm.notes")}</Label>
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
              {t("stepForm.cancel")}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={submit}
            >
              {isPending ? t("stepForm.saving") : t("stepForm.save")}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
