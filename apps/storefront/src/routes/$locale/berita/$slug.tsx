import { createFileRoute } from "@tanstack/react-router";
import { ArticleDetailPage } from "@/features/berita";

export const Route = createFileRoute("/$locale/berita/$slug")({
  component: ArticleDetailPage,
});
