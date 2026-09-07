import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/features/dashboard/layouts/DashboardLayout";

export const Route = createFileRoute("/admin/_preview")({
  // No requireAuth here on purpose: this is the unauthenticated design-preview
  // seam for viewing screens before the real API/auth flow exists. Reachable
  // in built bundles (staging included) so it can be shared for design review.
  component: DashboardLayout,
});
