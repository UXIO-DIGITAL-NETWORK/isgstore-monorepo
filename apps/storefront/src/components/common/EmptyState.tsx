import React from "react";
import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";

import { StateScreen } from "@/components/common/StateScreen";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Replaces the default inbox icon. */
  icon?: React.ReactNode;
  /** A call to action — "Reset filters", "Browse games", etc. */
  action?: React.ReactNode;
  /** Tighter vertical rhythm for states that sit inside a card or table. */
  compact?: boolean;
  className?: string;
}

/**
 * "The request succeeded and there is genuinely nothing to show."
 *
 * Distinct from an error, and deliberately distinct from silence: a section that
 * vanishes when empty leaves the visitor wondering whether the page broke. Copy
 * defaults to the shared `states` namespace, but every call site can pass its
 * own — an empty search and an empty catalog are not the same sentence.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  compact,
  className,
}: EmptyStateProps): React.JSX.Element {
  const { t } = useTranslation("states");

  return (
    <StateScreen
      icon={icon ?? <Inbox />}
      title={title ?? t("empty.title")}
      description={description ?? t("empty.description")}
      actions={action}
      className={cn(compact && "gap-3 py-8", className)}
    />
  );
}

export type { EmptyStateProps };
