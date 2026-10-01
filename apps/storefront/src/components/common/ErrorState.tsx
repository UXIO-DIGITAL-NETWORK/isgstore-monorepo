import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { Spinner } from "@/components/common/Spinner";
import { StateScreen } from "@/components/common/StateScreen";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** Re-runs the failed request. Omit for errors that cannot be retried. */
  onRetry?: () => void;
  isRetrying?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * `block` is the centered screen used for a section or page; `inline` is the
   * compact banner that replaces the red boxes hand-rolled per feature before.
   */
  variant?: "block" | "inline";
  className?: string;
}

/**
 * "The request failed."
 *
 * Always offers the retry when the caller can supply one: a failure the visitor
 * cannot act on is a dead end, and a page that recovers on a tap beats one that
 * requires a reload. The copy stays generic by default because most API errors
 * are not the customer's to diagnose.
 */
export function ErrorState({
  onRetry,
  isRetrying,
  title,
  description,
  variant = "block",
  className,
}: ErrorStateProps): React.JSX.Element {
  const { t } = useTranslation("states");
  const heading = title ?? t("error.title");
  const message = description ?? t("error.description");

  const retryLabel = isRetrying ? t("error.reloading") : t("error.retry");

  if (variant === "inline") {
    return (
      <Box
        role="alert"
        className={cn(
          "flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3.5",
          className,
        )}
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <Box className="flex flex-1 flex-col gap-1">
          <Text as="span" className="font-inter text-[13px] text-white/80">
            {heading}
          </Text>
          {message ? (
            <Text as="span" className="font-inter text-[12px] text-white/55">
              {message}
            </Text>
          ) : null}
        </Box>
        {onRetry ? (
          <Box
            as="button"
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 font-outfit text-[12px] font-semibold text-white transition-colors hover:bg-white/10 disabled:opacity-60"
          >
            {isRetrying ? <Spinner className="h-3.5 w-3.5" /> : <RotateCw className="h-3.5 w-3.5" />}
            {retryLabel}
          </Box>
        ) : null}
      </Box>
    );
  }

  return (
    <StateScreen
      tone="error"
      icon={<AlertTriangle />}
      title={heading}
      description={message}
      className={className}
      actions={
        onRetry ? (
          <Button onClick={onRetry} disabled={isRetrying} className="inline-flex items-center gap-2">
            {isRetrying ? <Spinner /> : <RotateCw className="h-4 w-4" />}
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}

export type { ErrorStateProps };
