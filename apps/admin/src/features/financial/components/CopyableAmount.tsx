import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";

interface CopyableAmountProps {
  value: number;
  className?: string;
}

/** Click-to-copy amount per product_requirements.md §4.2 — copies the exact
 * displayed string (incl. "Rp") and confirms via a sonner toast. */
export function CopyableAmount({ value, className }: CopyableAmountProps) {
  const formatted = formatCurrency(value);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    toast.success("Copied to clipboard", { description: formatted });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleCopy}
      aria-label={`Copy ${formatted}`}
      className={cn(
        "h-auto p-0 font-semibold tabular-nums text-foreground hover:bg-transparent hover:underline",
        className,
      )}
    >
      {formatted}
    </Button>
  );
}
