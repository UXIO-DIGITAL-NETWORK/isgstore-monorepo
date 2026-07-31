import { createFileRoute } from "@tanstack/react-router";
import { ArticlesTabPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/articles/")({
  component: ArticlesTabPage,
});
