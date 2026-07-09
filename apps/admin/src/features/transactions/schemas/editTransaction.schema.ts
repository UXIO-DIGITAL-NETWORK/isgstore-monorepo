import { z } from "zod";

const ACCEPTED_PROOF_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_PROOF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB, per system_architecture.md §4.9

/**
 * Edit Transaction modal (= manual status override), product_requirements.md
 * §4.3. Serial Number and the proof file are both optional — the reference
 * doesn't state either is mandatory to save.
 */
export const editTransactionSchema = z.object({
  paymentStatus: z.string().min(1, "Payment status is required"),
  invoiceStatus: z.string().min(1, "Invoice status is required"),
  serialNumber: z.string().optional(),
  proofFile: z
    .instanceof(File)
    .refine((file) => ACCEPTED_PROOF_TYPES.includes(file.type), "Only JPG, JPEG, or PNG files are allowed")
    .refine((file) => file.size <= MAX_PROOF_SIZE_BYTES, "File must be 10MB or smaller")
    .optional(),
});

export type EditTransactionFormValues = z.infer<typeof editTransactionSchema>;
