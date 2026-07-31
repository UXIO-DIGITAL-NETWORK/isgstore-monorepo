import { createFileRoute } from "@tanstack/react-router";
import { PageFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/pages/add/")({
  component: PageFormPage,
});
