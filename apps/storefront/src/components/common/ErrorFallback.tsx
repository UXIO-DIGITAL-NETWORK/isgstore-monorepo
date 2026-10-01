import React from "react";
import { AlertOctagon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Box } from "@/components/common/Box";
import { StateScreen } from "@/components/common/StateScreen";
import { Button } from "@/components/ui/Button";

/**
 * The full-screen notice shown when a render crash is caught.
 *
 * Separate from `ErrorBoundary` so that file exports only the class component —
 * a module with a hook-using component beside it is what the fast-refresh lint
 * rule rejects.
 */
export function ErrorFallback(): React.JSX.Element {
  const { t } = useTranslation("states");

  return (
    <Box className="flex min-h-screen items-center justify-center bg-[rgb(0,0,0)] px-4">
      <StateScreen
        tone="error"
        icon={<AlertOctagon />}
        title={t("error.title")}
        description={t("error.description")}
        actions={<Button onClick={() => window.location.reload()}>{t("error.reload")}</Button>}
      />
    </Box>
  );
}
