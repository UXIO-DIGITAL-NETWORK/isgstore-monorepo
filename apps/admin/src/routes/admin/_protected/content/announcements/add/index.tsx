import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementFormPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/announcements/add/")({
  component: AnnouncementFormPage,
});
