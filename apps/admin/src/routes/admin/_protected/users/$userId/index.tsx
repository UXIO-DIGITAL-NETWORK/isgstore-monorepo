import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { UserDetailPage } from "@/features/administration";

export const Route = createFileRoute("/admin/_protected/users/$userId/")({
  beforeLoad: () => requirePermission("users.view"),
  component: UserDetailPage,
});
