import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import i18n from "@/config/i18n";

const SUPPORTED_LOCALES = ["id", "en"] as const;

function LocaleLayout() {
  const { locale } = Route.useParams();
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);
  return <Outlet />;
}

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }) => {
    if (!SUPPORTED_LOCALES.includes(params.locale as (typeof SUPPORTED_LOCALES)[number])) {
      throw redirect({ href: "/id", replace: true });
    }
  },
  component: LocaleLayout,
});
