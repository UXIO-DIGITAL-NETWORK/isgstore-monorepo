import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/auth/layouts/AuthLayout";
import { requireGuest } from "@/middlewares/authMiddleware";

export const Route = createFileRoute("/_auth")({
  beforeLoad: () => requireGuest(),
  component: AuthLayout,
});
