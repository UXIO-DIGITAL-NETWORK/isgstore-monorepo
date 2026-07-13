import { createFileRoute } from "@tanstack/react-router";
import { FinancialPage } from "@/features/financial";

export const Route = createFileRoute("/admin/_preview/finance-preview/")({
  component: FinancialPage,
});
