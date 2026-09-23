import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/notifications";

// No permission gate, like the dashboard: a notification is addressed to one
// recipient and the API scopes the feed to the caller, so "may this admin see
// their own notifications" is not a question a permission can answer.
export const Route = createFileRoute("/admin/_protected/notifications/")({
  component: NotificationsPage,
});
