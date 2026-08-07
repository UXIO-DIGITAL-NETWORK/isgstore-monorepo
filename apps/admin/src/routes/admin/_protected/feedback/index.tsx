import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { FeedbackListPage } from "@/features/feedback";

export const Route = createFileRoute("/admin/_protected/feedback/")({
  beforeLoad: () => requirePermission("feedback.view"),
  component: FeedbackListPage,
});
