import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "@/features/auth";

// No `requirePermission`: this is the admin's own account security, not a
// managed resource. Enrolment is not reachable from here — it is forced before
// the panel opens, so anyone who can load this page has already enrolled.
export const Route = createFileRoute("/admin/_protected/settings/security/")({
  component: SecuritySettingsPage,
});
