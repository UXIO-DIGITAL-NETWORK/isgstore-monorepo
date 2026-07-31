import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementListPage } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content/announcements/")({
  component: AnnouncementListPage,
});
