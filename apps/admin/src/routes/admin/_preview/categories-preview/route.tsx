import { createFileRoute } from "@tanstack/react-router";
import { CategoryTabsLayout } from "@/features/categories";

export const Route = createFileRoute("/admin/_preview/categories-preview")({
  component: CategoryTabsLayout,
});
