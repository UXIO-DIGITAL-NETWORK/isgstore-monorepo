import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_preview/products-preview/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/products-preview/main" });
  },
});
