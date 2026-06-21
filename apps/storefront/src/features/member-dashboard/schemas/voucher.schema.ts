import { z } from "zod";

export const voucherSchema = z.object({
  code: z.string().min(1, "Kode voucher tidak boleh kosong"),
});

export type VoucherFormValues = z.infer<typeof voucherSchema>;
