import { createFileRoute } from "@tanstack/react-router";
import { ServerCategoryPage } from "@/features/categories";

export const Route = createFileRoute("/admin/_protected/categories/server-category/")({
  component: ServerCategoryPage,
});
