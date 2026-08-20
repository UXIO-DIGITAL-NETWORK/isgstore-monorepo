import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

// No public landing: the root bounces straight to the dashboard when signed in,
// or to /login when not.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { token } = useAuthStore.getState();
    throw redirect({ to: token ? "/admin/dashboard" : "/login" });
  },
});
