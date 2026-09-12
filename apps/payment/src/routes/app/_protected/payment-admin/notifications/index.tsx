import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/finance";
import { requirePaymentAdmin } from "@/middlewares/authMiddleware";

// The same page the internal team reads. It renders whatever the feed returns
// and the API scopes that to the caller, so there is nothing role-specific in
// it to fork.
export const Route = createFileRoute("/app/_protected/payment-admin/notifications/")({
  beforeLoad: () => requirePaymentAdmin(),
  component: NotificationsPage,
});
