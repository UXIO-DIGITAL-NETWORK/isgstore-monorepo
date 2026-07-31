import { createFileRoute } from "@tanstack/react-router";
import { requirePermission } from "@/middlewares/authMiddleware";
import { SettingsPage } from "@/features/administration";

export const Route = createFileRoute("/admin/_protected/settings/")({
  beforeLoad: () => requirePermission("settings.view"),
  component: SettingsPage,
});
