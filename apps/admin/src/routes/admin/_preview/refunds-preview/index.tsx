import { createFileRoute } from "@tanstack/react-router";
import { RefundsPage } from "@/features/refunds";

export const Route = createFileRoute("/admin/_preview/refunds-preview/")({
  component: RefundsPage,
});
