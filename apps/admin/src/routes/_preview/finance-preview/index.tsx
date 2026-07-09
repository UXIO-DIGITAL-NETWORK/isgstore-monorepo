import { createFileRoute } from "@tanstack/react-router";
import { FinancialPage } from "@/features/financial";

export const Route = createFileRoute("/_preview/finance-preview/")({
  component: FinancialPage,
});
