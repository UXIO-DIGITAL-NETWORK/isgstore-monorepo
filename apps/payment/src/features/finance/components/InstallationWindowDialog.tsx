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
import { Textarea } from "@/components/ui/textarea";
import type { InstallationScope, ServiceInstallation } from "@/types/service.type";

import { useUpsertInstallation } from "../hooks/useFinance";

/** `date` inputs want "YYYY-MM-DD"; an ISO string with a time will not bind. */
const toDateInput = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");

interface InstallationWindowDialogProps {
  scope: InstallationScope;
  installation: ServiceInstallation | null | undefined;
}

/** Sets or moves the agreed installation window. Upserts, so the first save on
 *  a comped subscription creates the record. */
export function InstallationWindowDialog({ scope, installation }: InstallationWindowDialogProps) {
  const { t } = useTranslation("finance");
  const [open, setOpen] = useState(false);
  const [startsAt, setStartsAt] = useState(toDateInput(installation?.starts_at));
  const [endsAt, setEndsAt] = useState(toDateInput(installation?.ends_at));
  const [notes, setNotes] = useState(installation?.notes ?? "");
  const [error, setError] = useState<string>();

  const { mutate: save, isPending } = useUpsertInstallation(scope);

  const reset = () => {
    setStartsAt(toDateInput(installation?.starts_at));
    setEndsAt(toDateInput(installation?.ends_at));
    setNotes(installation?.notes ?? "");
    setError(undefined);
  };

  const submit = () => {
    if (startsAt && endsAt && endsAt < startsAt) {
      setError(t("installWindow.endBeforeStart"));
      return;
    }

    save(
      {
        starts_at: startsAt || null,
        ends_at: endsAt || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          setError(undefined);
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Reset on OPEN too, not just on close: the state is seeded from an
        // `installation` prop that is undefined on first render, so a
        // close-only reset left the form blank for an already-scheduled
        // install the first time it was opened.
        reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant={installation ? "outline" : "default"}>
          {installation?.starts_at ? t("installWindow.triggerEdit") : t("installWindow.triggerCreate")}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("installWindow.title")}</DialogTitle>
          <DialogDescription>{t("installWindow.description")}</DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="grid gap-4 sm:grid-cols-2">
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="install-start">{t("installWindow.start")}</Label>
              <Input
                id="install-start"
                type="date"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
              />
            </Box>
            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="install-end">{t("installWindow.end")}</Label>
              <Input
                id="install-end"
                type="date"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="install-notes">{t("installWindow.notes")}</Label>
            <Textarea
              id="install-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Box>

          {error && (
            <Box className="text-sm text-destructive">{error}</Box>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("installWindow.cancel")}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={submit}
            >
              {isPending ? t("installWindow.saving") : t("installWindow.save")}
            </Button>
          </DialogFooter>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
