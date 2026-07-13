import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/_protected/transactions/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/transactions/automatic" });
  },
});
