import { createFileRoute } from "@tanstack/react-router";
import { FinancialPage } from "@/features/financial";

export const Route = createFileRoute("/admin/_protected/financial/")({
  component: FinancialPage,
});
