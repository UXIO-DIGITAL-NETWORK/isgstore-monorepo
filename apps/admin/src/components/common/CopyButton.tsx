import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** Undefined when the record carries no such reference yet. */
  value?: string;
  /** Names the value in the button's accessible label, e.g. "invoice number". */
  label: string;
  className?: string;
}

/**
 * Icon-only click-to-copy for a reference an operator retypes elsewhere — an
 * invoice number into a supplier dashboard, a gateway reference into
 * Monetapay.
 *
 * `CopyableAmount` in the financial feature is the older, amount-shaped
 * sibling; it stays as-is for now rather than being folded in here, so this
 * change carries no Financial regression risk.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  if (!value) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success("Copied to clipboard", { description: value });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className={cn("size-6 shrink-0 text-muted-foreground hover:text-foreground", className)}
    >
      <Copy className="size-3.5" />
    </Button>
  );
}
