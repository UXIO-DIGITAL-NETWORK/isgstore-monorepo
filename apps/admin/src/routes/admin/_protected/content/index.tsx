import { createFileRoute, redirect } from "@tanstack/react-router";

/** Bare /admin/content has no view of its own — land on the first tab. */
export const Route = createFileRoute("/admin/_protected/content/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/content/articles" });
  },
});
