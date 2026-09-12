import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { Info } from "lucide-react";

import { Box } from "@/components/common/Box";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * A small info icon that reveals a detailed explanation on hover/focus. Use it
 * next to a field label or a non-obvious button so operators know what a control
 * does without cluttering the layout with helper text.
 */
export function InfoTooltip({ content, className }: { content: ReactNode; className?: string }) {
  const { t } = useTranslation("common");
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        aria-label={t("field.moreInformation")}
        className={cn(
          "text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex size-4 items-center justify-center rounded-full outline-none focus-visible:ring-2",
          className,
        )}
      >
        <Info className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-left leading-snug whitespace-normal">{content}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A form label with an optional info tooltip beside it — the shape every field
 * repeats. Replaces a bare `<Label>` so any field can carry a concise, detailed
 * explanation with no extra markup at the call site.
 */
export function FieldLabel({
  htmlFor,
  children,
  tooltip,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  tooltip?: ReactNode;
  className?: string;
}) {
  return (
    <Box className={cn("flex items-center gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{children}</Label>
      {tooltip && <InfoTooltip content={tooltip} />}
    </Box>
  );
}
