import type { ContentSection } from "../types/content.type";
import type { ArticleFormValues } from "../schemas/contentForms.schema";

type SectionFormValue = ArticleFormValues["sections"][number];

/**
 * The API stores a body as `[{heading?, paragraphs[]}]`; the form edits each
 * section as a single textarea. Paragraphs are split on blank lines — the
 * convention writers already use — so the two representations convert cleanly
 * in both directions.
 */
export const sectionsToForm = (sections: ContentSection[]): SectionFormValue[] =>
  sections.map((section) => ({
    heading: section.heading ?? "",
    body: section.paragraphs.join("\n\n"),
  }));

export const formToSections = (values: SectionFormValue[]): ContentSection[] =>
  values
    .map((value) => ({
      // An empty heading is omitted rather than stored as "": the storefront
      // renders a heading element whenever the key is present.
      ...(value.heading?.trim() ? { heading: value.heading.trim() } : {}),
      paragraphs: value.body
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    }))
    .filter((section) => section.paragraphs.length > 0);

/** The page form edits `intro` as one textarea for the same reason. */
export const introToForm = (intro: string[]): string => intro.join("\n\n");

export const formToIntro = (value: string | undefined): string[] =>
  (value ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
