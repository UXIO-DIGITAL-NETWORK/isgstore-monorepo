import { createFileRoute } from "@tanstack/react-router";
import { ServerCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/_protected/categories/server-category/")({
  component: ServerCategoryPage,
});
