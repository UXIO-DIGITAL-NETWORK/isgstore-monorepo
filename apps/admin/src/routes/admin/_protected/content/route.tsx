import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { ContentTabsLayout } from "@/features/content";

export const Route = createFileRoute("/admin/_protected/content")({
  beforeLoad: () => requirePermission("content.view"),
  component: ContentTabsLayout,
});
