import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_preview/categories-preview/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/categories-preview/category" });
  },
});
