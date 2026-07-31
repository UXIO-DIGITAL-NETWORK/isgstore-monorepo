import { createFileRoute } from "@tanstack/react-router";
import { PageListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/pages/")({
  component: PageListPage,
});
