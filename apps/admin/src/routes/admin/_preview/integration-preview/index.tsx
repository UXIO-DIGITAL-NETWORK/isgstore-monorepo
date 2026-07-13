import { createFileRoute } from "@tanstack/react-router";
import { IntegrationPage } from "@/features/integration";

export const Route = createFileRoute("/admin/_preview/integration-preview/")({
  component: IntegrationPage,
});
