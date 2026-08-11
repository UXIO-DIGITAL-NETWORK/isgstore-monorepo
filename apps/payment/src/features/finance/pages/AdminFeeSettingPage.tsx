import { useState } from "react";
import { Box } from "@/components/common/Box";
import { Heading } from "@/components/common/Heading";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAdminFee, useUpdateAdminFee } from "../hooks/useFinance";

type FeeType = "percent" | "fixed";

export default function AdminFeeSettingPage() {
  const { data } = useAdminFee();
  const { mutate: save, isPending } = useUpdateAdminFee();

  // Local edits override the fetched setting; unedited fields fall back to it,
  // so no effect is needed to seed form state from the query.
  const [typeOverride, setTypeOverride] = useState<FeeType>();
  const [valueOverride, setValueOverride] = useState<number>();

  const type: FeeType = typeOverride ?? data?.type ?? "fixed";
  const value: number = valueOverride ?? data?.value ?? 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save({ type, value });
  };

  return (
    <Box className="flex flex-col gap-6">
      <Heading level={1}>Biaya Admin</Heading>
      <Text variant="small">
        Markup biaya admin global yang ditambahkan di atas biaya per metode pembayaran pada setiap transaksi.
      </Text>

      <Box
        as="form"
        onSubmit={onSubmit}
        className="flex max-w-md flex-col gap-5 rounded-xl border border-border bg-card p-6"
      >
        <Box className="flex flex-col gap-2">
          <Label>Tipe Biaya</Label>
          <Box className="flex gap-2">
            {(["fixed", "percent"] as FeeType[]).map((t) => (
              <Button
                key={t}
                type="button"
                variant={type === t ? "default" : "outline"}
                size="sm"
                className={cn("capitalize")}
                onClick={() => setTypeOverride(t)}
              >
                {t === "fixed" ? "Nominal (Rp)" : "Persen (%)"}
              </Button>
            ))}
          </Box>
        </Box>

        <Box className="flex flex-col gap-2">
          <Label htmlFor="value">{type === "percent" ? "Nilai (%)" : "Nilai (Rp)"}</Label>
          <Input
            id="value"
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValueOverride(Number(e.target.value))}
          />
          {type === "percent" && value > 100 && (
            <Text
              variant="small"
              className="text-destructive"
            >
              Persen tidak boleh lebih dari 100.
            </Text>
          )}
        </Box>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </Box>
    </Box>
  );
}
