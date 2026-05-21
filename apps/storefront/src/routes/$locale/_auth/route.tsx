import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/features/auth/layouts/AuthLayout";
import { requireGuest } from "@/middlewares/auth.guard";

export const Route = createFileRoute("/$locale/_auth")({
  beforeLoad: ({ params }) => requireGuest({ locale: params.locale }),
  component: AuthLayout,
});
