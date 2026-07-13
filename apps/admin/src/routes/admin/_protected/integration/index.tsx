import { createFileRoute } from "@tanstack/react-router";
import { IntegrationPage } from "@/features/integration";

export const Route = createFileRoute("/admin/_protected/integration/")({
  component: IntegrationPage,
});
