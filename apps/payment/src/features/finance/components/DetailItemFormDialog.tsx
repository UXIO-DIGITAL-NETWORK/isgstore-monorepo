import { useState } from "react";

import { Box } from "@/components/common/Box";
import { Text } from "@/components/common/Text";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceInstallationDetail } from "@/types/service.type";

import { useCreateDetailItem, useUpdateDetailItem } from "../hooks/useFinance";

interface DetailItemFormDialogProps {
  subscriptionId: number;
  installationId: number | undefined;
  detail?: ServiceInstallationDetail;
}

/**
 * Adds or edits one handed-over datum.
 *
 * On edit the value field starts EMPTY on purpose: leaving it blank keeps the
 * stored value, so renaming a label never pulls a secret back through the
 * browser to be re-submitted.
 */
export function DetailItemFormDialog({ subscriptionId, installationId, detail }: DetailItemFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(detail?.label ?? "");
  const [value, setValue] = useState("");
  const [isSecret, setIsSecret] = useState(detail?.is_secret ?? false);
  const [error, setError] = useState<string>();

  const { mutate: create, isPending: creating } = useCreateDetailItem(subscriptionId, installationId);
  const { mutate: update, isPending: updating } = useUpdateDetailItem(subscriptionId);

  const isEdit = Boolean(detail);
  const isPending = creating || updating;

  const reset = () => {
    setLabel(detail?.label ?? "");
    setValue("");
    setIsSecret(detail?.is_secret ?? false);
    setError(undefined);
  };

  const submit = () => {
    if (!label.trim()) {
      setError("Label wajib diisi.");
      return;
    }

    if (!isEdit && !value.trim()) {
      setError("Nilai wajib diisi.");
      return;
    }

    const done = {
      onSuccess: () => {
        setError(undefined);
        setOpen(false);
      },
    };

    if (detail) {
      update(
        {
          id: detail.id,
          // `value` omitted entirely when untouched — that is what preserves it.
          payload: { label: label.trim(), is_secret: isSecret, ...(value.trim() ? { value: value.trim() } : {}) },
        },
        done,
      );
    } else {
      create({ label: label.trim(), value: value.trim(), is_secret: isSecret }, done);
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
          disabled={!installationId}
        >
          {isEdit ? "Edit" : "Tambah Detail"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Detail" : "Tambah Detail"}</DialogTitle>
          <DialogDescription>
            Nilai disimpan terenkripsi. Yang ditandai rahasia hanya tampil tersamar ke client.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="detail-label">Label</Label>
            <Input
              id="detail-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="API Key"
            />
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="detail-value">Nilai</Label>
            <Textarea
              id="detail-value"
              rows={2}
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            {isEdit && (
              <Text
                variant="small"
                className="text-muted-foreground"
              >
                Kosongkan untuk mempertahankan nilai lama.
              </Text>
            )}
          </Box>

          <Box className="flex items-center justify-between gap-4">
            <Label htmlFor="detail-secret">Rahasia</Label>
            <Switch
              id="detail-secret"
              checked={isSecret}
              onCheckedChange={setIsSecret}
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
