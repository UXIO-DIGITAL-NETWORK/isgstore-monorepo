import { createFileRoute } from "@tanstack/react-router";
import { FaqListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/faqs/")({
  component: FaqListPage,
});
