import { createFileRoute, redirect } from "@tanstack/react-router";

// The app has no public landing — send everyone to the shell, which in turn
// bounces guests to /login.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/app/dashboard" });
  },
});
