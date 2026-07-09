import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/transactions/")({
  beforeLoad: () => {
    throw redirect({ to: "/transactions/automatic" });
  },
});
