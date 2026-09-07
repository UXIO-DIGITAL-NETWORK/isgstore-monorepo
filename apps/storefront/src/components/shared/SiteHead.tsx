import { useEffect } from "react";

import { useSiteSettings } from "@/hooks/useSiteSettings";

/** Creates the tag on first use so a document missing it still gets the value. */
function upsertMeta(selector: string, attributes: Record<string, string>, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    for (const [name, value] of Object.entries(attributes)) tag.setAttribute(name, value);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function upsertIcon(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  // The type is cleared rather than guessed: index.html pins
  // `type="image/svg+xml"` for the bundled Vite mark, and leaving that in place
  // would mislabel an uploaded PNG or ICO.
  link.removeAttribute("type");
  link.href = href;
}

/**
 * Keeps the document head in step with the SEO settings.
 *
 * `index.html` still ships a title, description and icon, and deliberately so:
 * they are what a crawler that does not run JavaScript sees, and what renders
 * during the first paint before settings have loaded. This only overrides them
 * once the admin's values are actually available.
 */
export function SiteHead(): null {
  const { text } = useSiteSettings();

  const title = text("meta_title") ?? text("site_name");
  const description = text("meta_description");
  const ogImage = text("og_image");
  const favicon = text("favicon");

  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (description) {
      upsertMeta('meta[name="description"]', { name: "description" }, description);
    }
  }, [description]);

  useEffect(() => {
    if (title) upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    if (description) {
      upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    }
    if (ogImage) upsertMeta('meta[property="og:image"]', { property: "og:image" }, ogImage);
  }, [title, description, ogImage]);

  useEffect(() => {
    if (favicon) upsertIcon(favicon);
  }, [favicon]);

  return null;
}
