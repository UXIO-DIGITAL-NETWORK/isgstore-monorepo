import { createFileRoute } from "@tanstack/react-router";
import { ServerCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_preview/categories-preview/server-category/")({
  component: ServerCategoryPage,
});
