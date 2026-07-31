import { createFileRoute } from "@tanstack/react-router";
import { NewsListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/news/")({
  component: NewsListPage,
});
