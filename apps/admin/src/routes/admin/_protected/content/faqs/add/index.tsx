import { createFileRoute } from "@tanstack/react-router";
import { FaqFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/faqs/add/")({
  component: FaqFormPage,
});
