/**
 * Lazy locale loader.
 *
 * `config/i18n.ts` used to statically import every namespace for both locales,
 * so all 38 JSON files were parsed as part of the entry bundle — including the
 * `en` copy a visitor on `/id` never reads. Here the files are globbed lazily
 * and only the active locale is fetched, in `beforeLoad`, before the locale
 * subtree renders.
 */
export type Locale = "id" | "en";

export const SUPPORTED_LOCALES: readonly Locale[] = ["id", "en"];

export type LocaleResource = Record<string, Record<string, unknown>>;

// Every `src/locales/<locale>/<namespace>.json`, imported on demand.
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>("./*/*.json");

export async function loadLocale(locale: Locale): Promise<LocaleResource> {
  const prefix = `./${locale}/`;
  const resources: LocaleResource = {};

  await Promise.all(
    Object.entries(localeModules)
      .filter(([path]) => path.startsWith(prefix))
      .map(async ([path, loader]) => {
        const namespace = path.slice(prefix.length).replace(/\.json$/, "");
        resources[namespace] = (await loader()).default;
      }),
  );

  return resources;
}
