import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import i18n from "@/config/i18n";
import { loadLocale, SUPPORTED_LOCALES, type Locale, type LocaleResource } from "@/locales";

function LocaleLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/$locale")({
  beforeLoad: async ({ params }) => {
    const locale = params.locale as Locale;

    if (!SUPPORTED_LOCALES.includes(locale)) {
      throw redirect({ href: "/id", replace: true });
    }

    // Load the active locale before the subtree renders so every page has its
    // strings on first paint — including `/en`, which used to flash Indonesian
    // while a post-render `changeLanguage` caught up.
    let loaded: Locale = locale;
    let resources: LocaleResource;

    try {
      resources = await loadLocale(locale);
    } catch {
      loaded = "id";
      resources = await loadLocale("id");
    }

    for (const [namespace, bundle] of Object.entries(resources)) {
      i18n.addResourceBundle(loaded, namespace, bundle as Record<string, string>, true, true);
    }
    await i18n.changeLanguage(locale);

    document.documentElement.lang = locale;
  },
  component: LocaleLayout,
});
