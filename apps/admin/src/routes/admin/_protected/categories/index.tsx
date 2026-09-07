import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_protected/categories/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/categories/category" });
  },
});
