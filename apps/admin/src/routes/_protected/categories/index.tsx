import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/categories/")({
  beforeLoad: () => {
    throw redirect({ to: "/categories/category" });
  },
});
