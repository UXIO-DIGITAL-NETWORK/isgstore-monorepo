import { createFileRoute } from "@tanstack/react-router";
import { IntegrationPage } from "@/features/integration";

export const Route = createFileRoute("/_preview/integration-preview/")({
  component: IntegrationPage,
});
