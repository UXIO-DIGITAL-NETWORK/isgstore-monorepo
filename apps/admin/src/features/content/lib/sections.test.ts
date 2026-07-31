import { describe, it, expect } from "vitest";

import { formToIntro, formToSections, introToForm, sectionsToForm } from "./sections";

describe("sectionsToForm / formToSections", () => {
  it("round-trips a section through the textarea representation", () => {
    const sections = [{ heading: "Intro", paragraphs: ["One.", "Two."] }];

    expect(formToSections(sectionsToForm(sections))).toEqual(sections);
  });

  it("splits paragraphs on blank lines, not single newlines", () => {
    const result = formToSections([{ heading: "", body: "Line one\nstill one.\n\nParagraph two." }]);

    expect(result[0].paragraphs).toEqual(["Line one\nstill one.", "Paragraph two."]);
  });

  // The storefront renders a heading element whenever the key is present, so
  // an empty string would produce a blank heading above the text.
  it("omits an empty heading rather than storing it as an empty string", () => {
    const result = formToSections([{ heading: "   ", body: "Body." }]);

    expect(result[0]).not.toHaveProperty("heading");
  });

  it("drops a section whose body is entirely blank", () => {
    expect(formToSections([{ heading: "Ghost", body: "   \n\n  " }])).toEqual([]);
  });
});

describe("introToForm / formToIntro", () => {
  it("round-trips the intro paragraphs", () => {
    const intro = ["First.", "Second."];

    expect(formToIntro(introToForm(intro))).toEqual(intro);
  });

  it("treats an absent intro as no paragraphs", () => {
    expect(formToIntro(undefined)).toEqual([]);
  });
});
