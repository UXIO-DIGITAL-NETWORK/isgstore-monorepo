import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import i18n from "@/config/i18n";
import { ensureUserHydrated } from "@/middlewares/auth.guard";

const SUPPORTED_LOCALES = ["id", "en"] as const;

function LocaleLayout() {
  const { locale } = Route.useParams();
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);
  return <Outlet />;
}

export const Route = createFileRoute("/$locale")({
  beforeLoad: async ({ params }) => {
    if (!SUPPORTED_LOCALES.includes(params.locale as (typeof SUPPORTED_LOCALES)[number])) {
      throw redirect({ href: "/id", replace: true });
    }
    // Restore the signed-in user on any locale page (public included) so a
    // valid session isn't rendered as a guest — the token survives a reload but
    // the cached user does not.
    await ensureUserHydrated();
  },
  component: LocaleLayout,
});
