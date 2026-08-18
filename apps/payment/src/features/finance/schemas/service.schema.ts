import { z } from "zod";

/** Mirrors StoreServiceRequest so the form fails before the round trip does. */
export const serviceSchema = z.object({
  code: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(50, "Kode maksimal 50 karakter")
    .regex(/^[a-z0-9-]+$/, "Kode hanya boleh huruf kecil, angka, dan tanda hubung"),
  name: z.string().min(1, "Nama wajib diisi").max(255, "Nama maksimal 255 karakter"),
  category: z.enum(["payment-gateway", "supplier", "communication", "infrastructure", "other"]),
  description: z.string().max(1000, "Deskripsi maksimal 1000 karakter").optional(),
  // Newline-separated in the textarea; split into the array the API wants.
  features: z.string().optional(),
  cost_price: z.number({ error: "Harga modal wajib diisi" }).int().min(0, "Harga modal tidak boleh negatif"),
  selling_price: z.number({ error: "Harga jual wajib diisi" }).int().min(0, "Harga jual tidak boleh negatif"),
  duration_days: z.number({ error: "Masa aktif wajib diisi" }).int().min(1, "Masa aktif minimal 1 hari"),
  is_active: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

/** Textarea lines → the `features` array; blank lines dropped. */
export const toFeatureList = (raw: string | undefined): string[] =>
  (raw ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
