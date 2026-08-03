import { createFileRoute } from "@tanstack/react-router";
import { ArticlesFormTabPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/articles/add/")({
  component: ArticlesFormTabPage,
});
