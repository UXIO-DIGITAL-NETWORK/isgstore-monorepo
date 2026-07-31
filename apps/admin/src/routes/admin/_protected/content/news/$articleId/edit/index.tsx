import { createFileRoute } from "@tanstack/react-router";
import { NewsFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/news/$articleId/edit/")({
  component: NewsFormPage,
});
