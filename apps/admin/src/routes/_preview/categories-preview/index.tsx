import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_preview/categories-preview/")({
  beforeLoad: () => {
    throw redirect({ to: "/categories-preview/category" });
  },
});
