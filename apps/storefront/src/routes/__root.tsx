import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "@/components/layouts/RootLayout";
import { NotFound } from "@/components/common/NotFound";

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
