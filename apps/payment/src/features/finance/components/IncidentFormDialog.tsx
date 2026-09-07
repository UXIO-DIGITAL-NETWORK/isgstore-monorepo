import { useState } from "react";

import { Box } from "@/components/common/Box";
import { SelectField } from "@/components/common/SelectField";
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
import { Textarea } from "@/components/ui/textarea";

import { useChannelFees, useCreateIncident, useFinanceServices } from "../hooks/useFinance";

const SEVERITY_OPTIONS = [
  { value: "MINOR", label: "Ringan" },
  { value: "MAJOR", label: "Berat" },
  { value: "CRITICAL", label: "Kritis" },
];

const STATUS_OPTIONS = [
  { value: "INVESTIGATING", label: "Sedang Diperiksa" },
  { value: "IDENTIFIED", label: "Penyebab Diketahui" },
  { value: "MONITORING", label: "Dipantau" },
  { value: "RESOLVED", label: "Selesai" },
];

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string. */
const toLocalInput = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Kita announces a disruption. The target is one of two things — a payment
 * channel or a service — and the API rejects both or neither, so the form
 * picks the kind first and only then offers the matching list.
 */
export function IncidentFormDialog() {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<"payment_channel" | "service">("payment_channel");
  const [targetId, setTargetId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("MINOR");
  const [status, setStatus] = useState("INVESTIGATING");
  const [startedAt, setStartedAt] = useState(() => toLocalInput(new Date()));
  const [estimatedAt, setEstimatedAt] = useState("");
  const [error, setError] = useState<string>();

  const { data: channels } = useChannelFees();
  const { data: services } = useFinanceServices({ page: 1, per_page: 100 });
  const { mutate: create, isPending } = useCreateIncident();

  const targetOptions =
    targetType === "payment_channel"
      ? (channels ?? []).map((channel) => ({ value: String(channel.id), label: channel.name }))
      : (services?.rows ?? []).map((service) => ({ value: String(service.id), label: service.name }));

  const reset = () => {
    setTargetId("");
    setTitle("");
    setMessage("");
    setSeverity("MINOR");
    setStatus("INVESTIGATING");
    setStartedAt(toLocalInput(new Date()));
    setEstimatedAt("");
    setError(undefined);
  };

  const submit = () => {
    if (!title.trim() || !message.trim() || !targetId) {
      setError("Judul, target, dan pesan wajib diisi.");
      return;
    }

    create(
      {
        title: title.trim(),
        message: message.trim(),
        severity,
        status,
        started_at: new Date(startedAt).toISOString(),
        estimated_resolved_at: estimatedAt ? new Date(estimatedAt).toISOString() : null,
        // Exactly one key is sent — the API refuses both.
        ...(targetType === "payment_channel"
          ? { payment_channel_id: Number(targetId) }
          : { service_id: Number(targetId) }),
      },
      {
        onSuccess: () => {
          reset();
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
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>Tambah Insiden</Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Insiden</DialogTitle>
          <DialogDescription>
            Insiden ini langsung tampil di halaman Status Layanan milik semua client.
          </DialogDescription>
        </DialogHeader>

        <Box className="flex flex-col gap-4">
          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="incident-title">Judul</Label>
            <Input
              id="incident-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="QRIS lambat"
            />
          </Box>

          <Box className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="incident-target-type"
              label="Jenis Target"
              options={[
                { value: "payment_channel", label: "Metode Pembayaran" },
                { value: "service", label: "Service" },
              ]}
              value={targetType}
              onChange={(value) => {
                setTargetType(value as "payment_channel" | "service");
                // The previous id belongs to the other list entirely.
                setTargetId("");
              }}
            />

            <SelectField
              id="incident-target"
              label="Target"
              options={targetOptions}
              value={targetId}
              onChange={setTargetId}
              placeholder="Pilih target"
              emptyLabel="Tidak ada pilihan"
            />

            <SelectField
              id="incident-severity"
              label="Tingkat"
              options={SEVERITY_OPTIONS}
              value={severity}
              onChange={setSeverity}
            />

            <SelectField
              id="incident-status"
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="incident-started">Mulai</Label>
              <Input
                id="incident-started"
                type="datetime-local"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </Box>

            <Box className="flex flex-col gap-1.5">
              <Label htmlFor="incident-estimated">Estimasi Selesai</Label>
              <Input
                id="incident-estimated"
                type="datetime-local"
                value={estimatedAt}
                onChange={(event) => setEstimatedAt(event.target.value)}
              />
            </Box>
          </Box>

          <Box className="flex flex-col gap-1.5">
            <Label htmlFor="incident-message">Pesan</Label>
            <Textarea
              id="incident-message"
              rows={3}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Settlement tertunda dari sisi provider."
            />
          </Box>

          {error && (
            <Text
              variant="small"
              className="text-destructive"
            >
              {error}
            </Text>
          )}

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
