import { createFileRoute, notFound } from "@tanstack/react-router";
import { DashboardLayout } from "@/features/dashboard/layouts/DashboardLayout";

export const Route = createFileRoute("/_preview")({
  // No requireAuth here on purpose: this is the unauthenticated design-preview
  // seam for viewing screens before the real API/auth flow exists. Gated
  // instead by build mode so it's inert in production.
  beforeLoad: () => {
    if (import.meta.env.PROD) {
      throw notFound();
    }
  },
  component: DashboardLayout,
});
