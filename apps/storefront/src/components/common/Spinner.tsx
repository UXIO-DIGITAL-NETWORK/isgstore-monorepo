import type React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline loading spinner. Rendered inside buttons while an async request is in
 * flight; the button is disabled at the same time so the action can't fire twice.
 */
export function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2
      role="status"
      aria-label="Loading"
      className={cn("w-4 h-4 animate-spin", className)}
      {...props}
    />
  );
}
