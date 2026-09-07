import { z } from "zod";

// Empty query shows all items; non-empty filters by service name.
export const priceListSearchSchema = z.object({
  query: z.string(),
});

export type PriceListSearchValues = z.infer<typeof priceListSearchSchema>;
