import { createFileRoute, notFound } from "@tanstack/react-router";

/**
 * Dev-only trigger for the 503 status page (system_architecture.md §4.12 Part 4).
 * Hidden in production builds so it can't be reached outside development.
 */
export const Route = createFileRoute("/error-preview")({
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  loader: () => {
    throw new Error("Deliberate error to preview the 503 status page.");
  },
});
