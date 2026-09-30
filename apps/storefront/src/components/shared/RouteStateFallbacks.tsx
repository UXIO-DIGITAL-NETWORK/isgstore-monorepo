import React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { Box } from "@/components/common/Box";
import { Skeleton } from "@/components/common/Skeleton";
import { StateScreen } from "@/components/common/StateScreen";
import { Text } from "@/components/common/Text";
import { Button } from "@/components/ui/Button";

/**
 * Router-level fallbacks, wired as `defaultErrorComponent` / `defaultPendingComponent`.
 *
 * These catch the two moments no page-level state can: a route's `beforeLoad`
 * throwing (a failed guard, a loader) and the pause while a route is loading.
 * They are the last line before the router's own bare error text, which is
 * exactly the unstyled dead end this work removes.
 */
export function RouteErrorComponent({ error, reset }: ErrorComponentProps): React.JSX.Element {
  const { t } = useTranslation("states");

  return (
    <Box className="flex min-h-screen items-center justify-center bg-[rgb(0,0,0)] px-4">
      <StateScreen
        tone="error"
        icon={<AlertTriangle />}
        title={t("error.title")}
        description={error?.message || t("error.description")}
        actions={<Button onClick={reset}>{t("error.retry")}</Button>}
      />
    </Box>
  );
}

export function RoutePendingComponent(): React.JSX.Element {
  const { t } = useTranslation("states");

  return (
    <Box aria-busy="true" className="min-h-screen bg-[rgb(0,0,0)]">
      <Box className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-6 h-52 w-full rounded-2xl md:h-72" />
        <Box className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} shape="card" className="aspect-3/4 w-full" />
          ))}
        </Box>
      </Box>
      <Text as="span" className="sr-only">
        {t("loading")}
      </Text>
    </Box>
  );
}
