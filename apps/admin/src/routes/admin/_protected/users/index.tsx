import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { UserListPage } from "@/features/administration";

export const Route = createFileRoute("/admin/_protected/users/")({
  beforeLoad: () => requirePermission("users.view"),
  component: UserListPage,
});
