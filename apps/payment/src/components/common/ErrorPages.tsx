import { useTranslation } from "react-i18next";

import { StatusPage } from "@/components/common/StatusPage";

/**
 * The router's 404 and error screens.
 *
 * They live here rather than in `__root.tsx` because route files are a registry
 * — no JSX, no copy — and because translated copy needs a component that can
 * call `useTranslation`. The illustrations and their dimensions stay props, as
 * they were.
 */
export function NotFoundPage() {
  const { t } = useTranslation("common");

  return (
    <StatusPage
      illustrationSrc="/illustrations/page-not-found.svg"
      illustrationAlt={t("errorPage.notFoundAlt")}
      illustrationWidth={320}
      illustrationHeight={212}
      title={t("errorPage.title")}
      subtitle={t("errorPage.notFoundSubtitle")}
      body={t("errorPage.notFoundBody")}
      actionLabel={t("errorPage.backHome")}
    />
  );
}

export function ServerErrorPage() {
  const { t } = useTranslation("common");

  return (
    <StatusPage
      illustrationSrc="/illustrations/server-error.svg"
      illustrationAlt={t("errorPage.serverErrorAlt")}
      illustrationWidth={320}
      illustrationHeight={248}
      code="503"
      title={t("errorPage.title")}
      subtitle={t("errorPage.serverErrorSubtitle")}
      body={t("errorPage.serverErrorBody")}
      actionLabel={t("errorPage.backHome")}
    />
  );
}
