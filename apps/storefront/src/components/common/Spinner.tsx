import type React from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * Inline loading spinner. Rendered inside buttons while an async request is in
 * flight; the button is disabled at the same time so the action can't fire twice.
 *
 * The label is translated because it is the only thing a screen-reader user
 * gets from this element — an English "Loading" announced mid-Indonesian page is
 * exactly the kind of seam that goes unnoticed by everyone who can see it.
 */
export function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useTranslation("common");

  return (
    <Loader2
      role="status"
      aria-label={t("a11y.loading")}
      className={cn("w-4 h-4 animate-spin", className)}
      {...props}
    />
  );
}
