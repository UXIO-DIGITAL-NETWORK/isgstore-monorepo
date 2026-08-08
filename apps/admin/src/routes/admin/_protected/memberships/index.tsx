import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { MembershipListPage } from "@/features/membership";

export const Route = createFileRoute("/admin/_protected/memberships/")({
  beforeLoad: () => requirePermission("memberships.view"),
  component: MembershipListPage,
});
