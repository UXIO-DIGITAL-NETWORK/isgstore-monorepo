import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_protected/products/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/products/main" });
  },
});
