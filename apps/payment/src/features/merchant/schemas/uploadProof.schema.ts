import { z } from "zod";

// The bukti transfer for a service invoice: image or PDF, max 4MB — mirrors the
// backend UploadServiceProofRequest rules.
const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];

export const uploadProofSchema = z.object({
  proof: z
    .instanceof(File, { message: "Bukti transfer wajib diunggah" })
    .refine((file) => file.size > 0, "Bukti transfer wajib diunggah")
    .refine((file) => file.size <= MAX_BYTES, "Ukuran maksimal 4MB")
    .refine((file) => ACCEPTED.includes(file.type), "Format harus JPG, PNG, WEBP, atau PDF"),
});

export type UploadProofFormValues = z.infer<typeof uploadProofSchema>;
